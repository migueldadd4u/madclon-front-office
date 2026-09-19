import json
import subprocess
import unittest
from unittest.mock import patch

import hardware_publico as hw


class PublicHardwareTest(unittest.TestCase):
    def test_numeric_boundary(self):
        for value in (True, False, '35', 'secret/path', float('nan'), float('inf'), -1, {}, 10 ** 10000):
            self.assertIsNone(hw.number(value))
        self.assertEqual(hw.number(0), 0)
        self.assertIsNone(hw.number(101, 100))

    def test_allowlist_drops_canaries(self):
        raw = {key: 'CANARY-secret' for key in hw.FIELDS}
        raw.update(id='CANARY-host', sampled_at='CANARY-date', processes=['CANARY-name'], stderr='CANARY-error', model='CANARY-model')
        host = hw.public_host('mac', raw)
        self.assertEqual(set(host), {'id', 'sampled_at', *hw.FIELDS})
        self.assertNotIn('CANARY', json.dumps(host))
        self.assertIsNone(host['sampled_at'])

    def test_limits_and_incoherent_memory(self):
        host = hw.public_host('dgx', dict(cpu_percent=101, gpu_percent=-1, gpu_temperature_c=151,
                                         ram_total_bytes=10, ram_available_bytes=11, disk_available_bytes=8))
        for key in ('cpu_percent', 'gpu_percent', 'gpu_temperature_c', 'ram_available_bytes', 'disk_available_bytes'):
            self.assertIsNone(host[key])
        self.assertRegex(host['sampled_at'], r'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$')

    def test_cpu_uses_second_sample(self):
        text = 'CPU usage: 10.0% user, 5.0% sys, 85.0% idle\nCPU usage: 20.0% user, 5.0% sys, 75.0% idle'
        self.assertEqual(hw.parse_cpu(text), 25)
        self.assertIsNone(hw.parse_cpu('unavailable'))
        self.assertIsNone(hw.parse_cpu('CPU usage: 10% user, 5% sys, 85% idle'))

    def test_ram_and_swap_parsers(self):
        text = 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free: 10.\nPages inactive: 20.\nPages speculative: 3.'
        self.assertEqual(hw.parse_available(text), 33 * 16384)
        self.assertIsNone(hw.parse_available('Pages free: 10'))
        self.assertEqual(hw.parse_swap('total = 1024.00M used = 3.50M free = 1020.50M'), 3.5 * 1024 ** 2)
        self.assertIsNone(hw.parse_swap('failed'))

    def test_command_failure_has_no_exception_text(self):
        with patch.object(hw.subprocess, 'run', side_effect=subprocess.TimeoutExpired('CANARY', 1)):
            self.assertEqual(hw.run(['fixed']), '')

    def test_both_failed_hosts_still_present(self):
        with patch.object(hw, 'collect_mac', side_effect=RuntimeError('CANARY')), patch.object(hw, 'collect_dgx', return_value={}):
            result = hw.collect_public_hardware()
        self.assertEqual(result['version'], 1)
        self.assertEqual([h['id'] for h in result['hosts']], ['mac', 'dgx'])
        self.assertTrue(all(h['sampled_at'] is None for h in result['hosts']))
        self.assertNotIn('CANARY', json.dumps(result))

    def test_remote_is_fixed_and_timeout_bounded(self):
        with patch.object(hw, 'run', return_value='{"cpu_percent":42,"stderr":"CANARY"}') as run:
            host = hw.public_host('dgx', hw.collect_dgx())
        args, kwargs = run.call_args
        self.assertEqual(args[0], ['/usr/bin/ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=3', 'dgx-spark-MAD', 'python3', '-'])
        self.assertEqual(kwargs['timeout'], 9)
        self.assertEqual(host['cpu_percent'], 42)
        self.assertNotIn('CANARY', json.dumps(host))

    def test_bad_remote_json_and_wrong_shape(self):
        for text in ('CANARY', '[1,2]', 'null'):
            with patch.object(hw, 'run', return_value=text):
                self.assertEqual(hw.collect_dgx(), {})

    def test_mac_timeout_budget_and_partial_metrics(self):
        commands = []
        def fake_run(command, timeout=1.5, input_text=None):
            commands.append((command, timeout))
            return ''
        with patch.object(hw.platform, 'system', return_value='Darwin'), patch.object(hw, 'run', side_effect=fake_run), patch.object(hw.os, 'statvfs', side_effect=OSError('CANARY')):
            host = hw.public_host('mac', hw.collect_mac())
        self.assertIsNone(host['sampled_at'])
        self.assertLessEqual(sum(timeout for command, timeout in commands), 11)
        self.assertEqual(len(commands), 5)
        self.assertNotIn('CANARY', json.dumps(host))

    def test_js_safe_bytes_and_power(self):
        for value in (2 ** 53, 10 ** 16, 1.5, -1, True):
            host = hw.public_host('mac', {'ram_total_bytes': value})
            self.assertIsNone(host['ram_total_bytes'])
        self.assertEqual(hw.public_host('mac', {'ram_total_bytes': 2 ** 53 - 1})['ram_total_bytes'], 2 ** 53 - 1)
        self.assertEqual(hw.public_host('mac', {'ram_total_bytes': 12.0})['ram_total_bytes'], 12)
        self.assertIsNone(hw.public_host('mac', {'gpu_power_w': 10001})['gpu_power_w'])
        self.assertEqual(hw.public_host('mac', {'gpu_power_w': 10000})['gpu_power_w'], 10000)
        self.assertIsInstance(hw.parse_swap('used = 37988.94M'), int)

    def test_command_locale(self):
        with patch.object(hw.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, stdout='ok')) as run:
            self.assertEqual(hw.run(['fixed']), 'ok')
        self.assertEqual(run.call_args.kwargs['env']['LC_ALL'], 'C')
        self.assertEqual(run.call_args.kwargs['env']['LANG'], 'C')

    def test_valid_zero_is_measurement(self):
        host = hw.public_host('mac', {'cpu_percent': 0, 'ram_total_bytes': 10, 'ram_available_bytes': 10})
        self.assertEqual(host['cpu_percent'], 0)
        self.assertIsNotNone(host['sampled_at'])


if __name__ == '__main__':
    unittest.main()
