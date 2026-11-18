import contextlib
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).parent))
import story_link_lab as lab

PATH = Path(__file__).with_name("sabah-pearl-story-lab.json")

class StoryLinkProofTests(unittest.TestCase):
    def setUp(self):
        self.approved = lab.load_manifest(PATH)

    def test_approved_asset_and_url(self):
        self.assertIn("nexus-social-assets", self.approved["image"])
        self.assertTrue(self.approved["product_url"].endswith("/perfume/sabah-al-ward-pearl/"))
        self.assertEqual(self.approved["status"], "approved")

    def test_dry_run_marks_it_as_internal(self):
        url = lab.test_link(self.approved)
        p = urlparse(url)
        qs = parse_qs(p.query)
        self.assertEqual(p.hostname, "www.valenzaparfums.com.br")
        self.assertEqual(qs["utm_medium"], ["internal_test"])
        self.assertEqual(qs["utm_source"], ["valenza_interno"])
        self.assertTrue(qs["utm_campaign"][0].startswith("lab_story_link_"))
        self.assertIn("story_", qs["utm_content"][0])

    def test_reject_unapproved_or_external_images(self):
        copied = dict(self.approved)
        copied["image"] = "https://bad.example/story.jpg"
        with self.assertRaises(ValueError):
            lab.load_manifest(self.write_temp(copied))
        copied = dict(self.approved)
        copied["status"] = "waiting"
        with self.assertRaises(ValueError):
            lab.load_manifest(self.write_temp(copied))
        copied = dict(self.approved)
        copied["product_url"] = "https://bad.example/perfume/anything/"
        with self.assertRaises(ValueError):
            lab.load_manifest(self.write_temp(copied))

    def write_temp(self, obj):
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as out:
            out.write(json.dumps(obj))
            self.addCleanup(lambda: Path(out.name).unlink(missing_ok=True))
            return Path(out.name)

    def test_main_does_not_send_or_login(self):
        with patch.object(sys, "argv", ["story_link_lab.py"]), contextlib.redirect_stdout(io.StringIO()) as output:
            result = lab.main()
        self.assertEqual(result, 0)
        data = json.loads(output.getvalue())
        self.assertEqual(data["status"], "DRY_RUN_OK")
        self.assertFalse(data["official_account_used"])
        self.assertFalse(data["production_schedule_changed"])

    def test_main_account_hard_block(self):
        with self.assertRaises(ValueError):
            lab.publish_only_secondary(self.approved, lab.test_link(self.approved),
                                       "valenza.parfumsimportados")

if __name__ == "__main__":
    unittest.main()
