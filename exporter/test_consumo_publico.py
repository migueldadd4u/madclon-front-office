import unittest
from datetime import datetime, timezone, timedelta
from consumo_publico import sanear

class ConsumoPublico(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026,11,1,19,30,tzinfo=timezone.utc)
        self.row = {"provider":"codex","historyDays":30,"reportingPeriod":"rolling:30","updatedAt":self.now.isoformat(),"last30DaysTokens":100,"last30DaysCostUSD":2,"totals":{"provenance":"listPriceEstimate"},"secret":"private-project"}
    def test_whitelist(self):
        out=sanear([self.row],now=self.now)
        self.assertEqual(out[0]["currency"],"USD")
        self.assertNotIn("secret",str(out)); self.assertNotIn("private-project",str(out))
    def test_stale_future_period(self):
        for patch in ({"updatedAt":(self.now-timedelta(days=2)).isoformat()},{"updatedAt":(self.now+timedelta(seconds=1)).isoformat()},{"historyDays":7},{"reportingPeriod":"all"}):
            self.assertEqual(sanear([{**self.row,**patch}],now=self.now),[])
    def test_missing_not_zero(self):
        for v in (None,-1,float("nan"),float("inf"),True):
            self.assertEqual(sanear([{**self.row,"last30DaysTokens":v}],now=self.now),[])
    def test_manual_expiry_and_currency(self):
        m={"days":30,"tokens":200,"amount":4,"currency":"EUR","observed_at":self.now.isoformat(),"secret":"hidden"}
        self.assertEqual(len(sanear([self.row],m,self.now)),2)
        self.assertEqual(sanear([],m,self.now+timedelta(days=2)),[])
        self.assertEqual(sanear([],{**m,"currency":"USD"},self.now),[])
    def test_duplicates_not_summed(self):
        self.assertEqual(len(sanear([self.row,self.row],now=self.now)),1)

if __name__ == "__main__": unittest.main()
