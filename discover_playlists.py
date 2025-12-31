#!/usr/bin/env python3
"""
Web scraper to discover all Cyprus Avenue playlists on KCUR website.
Identifies available playlists and compares against existing archive.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from pathlib import Path
import time


def fetch_page_playlists(url):
    """Fetch playlists from a single page"""
    discovered = []

    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    if response.status_code != 200:
        print(f"  Error fetching {url} (status {response.status_code})")
        return discovered

    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all links with dates in URL
    all_links = soup.find_all('a', href=True)
    article_links = [l for l in all_links if re.search(r'/\d{4}-\d{2}-\d{2}/', l.get('href', ''))]

    # Deduplicate by URL
    seen_urls = set()
    for link in article_links:
        url = link.get('href')
        if not url.startswith('http'):
            url = 'https://www.kcur.org' + url

        if url in seen_urls:
            continue
        seen_urls.add(url)

        title = link.get_text(strip=True)
        if not title:
            title = url.split('/')[-1].replace('-', ' ').title()

        # Extract date from URL
        date_match = re.search(r'/(\d{4})-(\d{2})-(\d{2})/', url)
        date_str = date_match.group(0)[1:-1] if date_match else None

        discovered.append({
            'title': title,
            'date': date_str,
            'url': url
        })

    return discovered


def fetch_kcur_playlists():
    """
    Fetch all Cyprus Avenue content from KCUR website.
    Try multiple strategies to get all content including pagination.
    """
    base_url = "https://www.kcur.org/tags/cyprus-avenue"

    print("Fetching Cyprus Avenue content from KCUR...")
    print("Trying multiple pagination strategies...")

    all_discovered = []
    seen_urls = set()

    # Strategy 1: Try the main tag page
    print(f"\n[1/3] Fetching main tag page...")
    page_items = fetch_page_playlists(base_url)
    print(f"  Found {len(page_items)} items")
    for item in page_items:
        if item['url'] not in seen_urls:
            all_discovered.append(item)
            seen_urls.add(item['url'])

    # Strategy 2: Try common pagination patterns (page parameter)
    print(f"\n[2/3] Trying page number pagination...")
    for page_num in range(1, 20):  # Try up to 20 pages
        url = f"{base_url}?page={page_num}"
        page_items = fetch_page_playlists(url)
        if not page_items:
            print(f"  No results on page {page_num}, stopping pagination")
            break

        new_items = 0
        for item in page_items:
            if item['url'] not in seen_urls:
                all_discovered.append(item)
                seen_urls.add(item['url'])
                new_items += 1

        print(f"  Page {page_num}: {new_items} new items")
        if new_items == 0:
            print(f"  No new items, stopping pagination")
            break

        time.sleep(0.5)  # Be nice to the server

    # Strategy 3: Try offset-based pagination
    print(f"\n[3/3] Trying offset-based pagination...")
    offset = 0
    limit = 10
    max_attempts = 50
    attempts = 0

    while attempts < max_attempts:
        url = f"{base_url}?offset={offset}&limit={limit}"
        page_items = fetch_page_playlists(url)

        if not page_items:
            break

        new_items = 0
        for item in page_items:
            if item['url'] not in seen_urls:
                all_discovered.append(item)
                seen_urls.add(item['url'])
                new_items += 1

        if new_items > 0:
            print(f"  Offset {offset}: {new_items} new items")

        if new_items == 0:
            break

        offset += limit
        attempts += 1
        time.sleep(0.5)

    print(f"\n✓ Total unique items discovered: {len(all_discovered)}")
    return all_discovered


def analyze_gaps(discovered_playlists, archive_dir='json/individual'):
    """
    Compare discovered playlists against existing archive.
    """
    # Load existing archive dates
    archive_path = Path(archive_dir)
    if not archive_path.exists():
        print(f"Warning: Archive directory {archive_dir} not found")
        return

    archived_dates = set()
    archived_playlists = []

    for json_file in archive_path.glob('*.json'):
        with open(json_file, 'r') as f:
            data = json.load(f)
            if data.get('date'):
                archived_dates.add(data['date'])
                archived_playlists.append(data)

    print(f"\n{'='*70}")
    print(f"Archive Analysis")
    print(f"{'='*70}")
    print(f"Playlists in archive: {len(archived_dates)}")
    print(f"Playlists discovered on KCUR: {len(discovered_playlists)}")

    # Filter discovered playlists to only music shows (not news articles)
    music_keywords = ['playlist', 'music', 'songs', 'artist', 'album', 'tribute', 'favorites']
    exclude_keywords = ['dies', 'remembering', 'final broadcast', 'ends his', 'trial']

    potential_playlists = []
    for item in discovered_playlists:
        title_lower = item['title'].lower()
        # Exclude obituaries and news articles
        if any(keyword in title_lower for keyword in exclude_keywords):
            continue
        potential_playlists.append(item)

    print(f"Potential music playlists discovered: {len(potential_playlists)}")

    # Find gaps - discovered dates not in archive
    discovered_dates = set()
    for item in potential_playlists:
        if item['date']:
            discovered_dates.add(item['date'])

    missing_dates = discovered_dates - archived_dates

    if missing_dates:
        print(f"\n⚠️  Found {len(missing_dates)} playlists on KCUR not in archive:")
        for date in sorted(missing_dates):
            matching = [p for p in potential_playlists if p['date'] == date]
            if matching:
                print(f"  - {date}: {matching[0]['title']}")
                print(f"    URL: {matching[0]['url']}")
    else:
        print(f"\n✓ All discovered playlists are already in the archive!")

    # Show date range comparison
    if archived_dates:
        print(f"\nArchive date range: {min(archived_dates)} to {max(archived_dates)}")
    if discovered_dates:
        print(f"Discovered date range: {min(discovered_dates)} to {max(discovered_dates)}")

    return {
        'discovered': potential_playlists,
        'missing': [p for p in potential_playlists if p['date'] in missing_dates]
    }


def main():
    """Main execution"""
    print("Cyprus Avenue Playlist Discovery Tool")
    print("=" * 70)

    # Discover playlists on KCUR
    discovered = fetch_kcur_playlists()

    if not discovered:
        print("No playlists discovered. Check your internet connection or the site may have changed.")
        return

    # Save discovered playlists
    with open('discovered_playlists.json', 'w') as f:
        json.dump(discovered, f, indent=2)

    print(f"✓ Saved discovered playlists to discovered_playlists.json")

    # Analyze gaps
    results = analyze_gaps(discovered)

    # Save gap analysis
    if results:
        with open('gap_analysis.json', 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n✓ Saved gap analysis to gap_analysis.json")


if __name__ == '__main__':
    main()
