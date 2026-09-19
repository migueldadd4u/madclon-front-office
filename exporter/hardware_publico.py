"""Public hardware readings: fixed hosts, numeric allowlist, no process data."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import math
import os
import platform
import re
import subprocess

FIELDS = (
    'cpu_percent', 'ram_total_bytes', 'ram_available_bytes', 'swap_used_bytes',
    'gpu_percent', 'gpu_temperature_c', 'gpu_power_w', 'disk_total_bytes',
    'disk_available_bytes',
)


def number(value, maximum=None):
    """Reject strings, booleans, NaN and infinity at the publication boundary."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        if not math.isfinite(value) or value < 0 or (maximum is not None and value > maximum):
            return None
    except (OverflowError, TypeError):
        return None
    return value


def public_host(host_id, raw):
    if host_id not in ('mac', 'dgx'):
        raise ValueError('Unsupported host')
    raw = raw if isinstance(raw, dict) else {}
    result = {'id': host_id, 'sampled_at': None}
    for field in FIELDS:
        limit = 100 if field.endswith('_percent') else 150 if field == 'gpu_temperature_c' else None
        if field == 'gpu_power_w':
            limit = 10000
        elif field.endswith('_bytes'):
            limit = 2 ** 53 - 1
        value = number(raw.get(field), limit)
        if field.endswith('_bytes') and value is not None:
            value = int(value) if value == int(value) else None
        result[field] = value
    for prefix in ('ram', 'disk'):
        total, available = result[prefix + '_total_bytes'], result[prefix + '_available_bytes']
        if available is not None and (total is None or available > total):
            result[prefix + '_available_bytes'] = None
    # Timestamp is generated here; remote text never crosses the public boundary.
    if any(result[field] is not None for field in FIELDS):
        result['sampled_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    return result


def run(command, timeout=1.5, input_text=None):
    try:
        result = subprocess.run(command, input=input_text, capture_output=True,
                                text=True, timeout=timeout, check=True,
                                env={**os.environ, 'LC_ALL': 'C', 'LANG': 'C'})
        return result.stdout
    except (OSError, subprocess.SubprocessError, UnicodeError):
        return ''


def parse_cpu(text):
    samples = re.findall(r'CPU usage:\s*([\d.]+)% user,\s*([\d.]+)% sys,\s*([\d.]+)% idle', text)
    if len(samples) < 2:
        return None
    return number(100 - float(samples[-1][2]), 100)


def parse_available(text):
    page = re.search(r'page size of (\d+) bytes', text)
    counts = [re.search(r'Pages ' + name + r':\s*(\d+)', text)
              for name in ('free', 'inactive', 'speculative')]
    return int(page[1]) * sum(int(count[1]) for count in counts) if page and all(counts) else None


def parse_swap(text):
    match = re.search(r'used\s*=\s*([\d.]+)([KMGT])', text)
    return round(float(match[1]) * 1024 ** ('KMGT'.index(match[2]) + 1)) if match else None


def collect_mac():
    if platform.system() != 'Darwin':
        return {}
    raw = {}
    cpu = run(['/usr/bin/top', '-l', '2', '-s', '1', '-n', '0'], timeout=4.5)
    raw['cpu_percent'] = parse_cpu(cpu)
    total = run(['/usr/sbin/sysctl', '-n', 'hw.memsize']).strip()
    raw['ram_total_bytes'] = int(total) if total.isdigit() else None
    raw['ram_available_bytes'] = parse_available(run(['/usr/bin/vm_stat']))
    raw['swap_used_bytes'] = parse_swap(run(['/usr/sbin/sysctl', 'vm.swapusage']))
    gpu = run(['/usr/sbin/ioreg', '-r', '-c', 'AGXAccelerator', '-l'])
    match = re.search(r'"Device Utilization %"\s*=\s*(\d+)', gpu)
    raw['gpu_percent'] = int(match[1]) if match else None
    try:
        disk = os.statvfs('/')
        raw['disk_total_bytes'] = disk.f_blocks * disk.f_frsize
        raw['disk_available_bytes'] = disk.f_bavail * disk.f_frsize
    except OSError:
        pass
    return raw


# This script is constant. No paths, hostnames, model names or process lists
# are returned, even when a remote tool fails. SSH receives no user arguments.
DGX_SCRIPT = r'''
import json, os, subprocess, time
r = {}
def read(path):
    with open(path) as f:
        return f.read()
def cpu():
    a = list(map(int, read('/proc/stat').splitlines()[0].split()[1:9]))
    return sum(a), a[3] + a[4]
try:
    before = cpu()
    time.sleep(0.3)
    after = cpu()
    delta = after[0] - before[0]
    if delta > 0:
        r['cpu_percent'] = 100 * (1 - (after[1] - before[1]) / delta)
except Exception:
    pass
try:
    mem = {line.split(':')[0]: int(line.split()[1]) * 1024 for line in read('/proc/meminfo').splitlines()}
    r['ram_total_bytes'] = mem.get('MemTotal')
    r['ram_available_bytes'] = mem.get('MemAvailable')
    if 'SwapTotal' in mem and 'SwapFree' in mem:
        r['swap_used_bytes'] = mem['SwapTotal'] - mem['SwapFree']
except Exception:
    pass
try:
    disk = os.statvfs('/')
    r['disk_total_bytes'] = disk.f_blocks * disk.f_frsize
    r['disk_available_bytes'] = disk.f_bavail * disk.f_frsize
except Exception:
    pass
try:
    s = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,temperature.gpu,power.draw', '--format=csv,noheader,nounits'], capture_output=True, text=True, check=True, timeout=2, env={**os.environ, 'LC_ALL': 'C', 'LANG': 'C'})
    row = s.stdout.splitlines()[0].split(',')
    for key, value in zip(('gpu_percent', 'gpu_temperature_c', 'gpu_power_w'), row):
        try:
            r[key] = float(value.strip())
        except ValueError:
            pass
except Exception:
    pass
print(json.dumps(r))
'''


def collect_dgx():
    text = run(['/usr/bin/ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=3',
                'dgx-spark-MAD', 'python3', '-'], timeout=9, input_text=DGX_SCRIPT)
    try:
        result = json.loads(text)
        return result if isinstance(result, dict) else {}
    except (ValueError, TypeError):
        return {}


def collect_public_hardware():
    with ThreadPoolExecutor(max_workers=2) as pool:
        jobs = [('mac', pool.submit(collect_mac)), ('dgx', pool.submit(collect_dgx))]
        hosts = []
        for host_id, future in jobs:
            try:
                raw = future.result()
            except Exception:
                raw = {}
            hosts.append(public_host(host_id, raw))
    return {'version': 1, 'hosts': hosts}


if __name__ == '__main__':
    print(json.dumps(collect_public_hardware(), allow_nan=False))
