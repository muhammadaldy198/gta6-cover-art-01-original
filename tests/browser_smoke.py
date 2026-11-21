from pathlib import Path
import sys
sys.path.insert(0, str(Path('.qa/python').resolve()))
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

def launch(playwright):
    return playwright.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                                      args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])

if __name__ == '__main__':
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport={'width':1280,'height':900}, device_scale_factor=1)
        page.goto('http://127.0.0.1:8080')
        page.wait_for_load_state('networkidle')
        expect(page.get_by_role('heading', name='Make your own getaway.')).to_be_visible(timeout=5000)
        expect(page.locator('[data-panel]:visible')).to_have_count(7)
        expect(page.get_by_role('button', name='Export PNG')).to_be_enabled()
        assert page.locator('#cover').evaluate('(c) => c.width === 1920 && c.height === 1080')
        with page.expect_download() as event:
            page.get_by_role('button', name='Export PNG', exact=True).click()
        download = event.value
        output = ROOT / '.qa' / 'revision' / 'smoke-export.png'
        output.parent.mkdir(parents=True,exist_ok=True)
        download.save_as(output)
        assert output.stat().st_size > 1000
        expect(page.get_by_role('status')).to_contain_text('PNG ready')
        print('PASS browser smoke: loaded 7-panel editor and actual PNG download')
        browser.close()
