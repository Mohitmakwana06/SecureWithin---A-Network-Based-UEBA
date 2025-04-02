from elasticsearch import Elasticsearch
from elasticsearch.exceptions import AuthenticationException, ConnectionError, ApiError
import urllib3
import csv
import re
import requests
from collections import defaultdict

# Suppress SSL warnings (ONLY if using a self-signed certificate)
urllib3.disable_warnings()

# Elasticsearch connection details
ELASTICSEARCH_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = "OU=7ze4HXE1ihPOptGBC"
INDEX_NAME = "proxy-logs"

RESTRICTED_DOMAINS_FILE = "D:/UEBA/ueba/server/app/restricted_domains.csv"
LOG_FILE = "surfed_domains.txt"

# Field containing domain name
URL_FIELD = "destination.domain"

# Hybrid Analysis API
HYBRID_ANALYSIS_URL = "https://www.hybrid-analysis.com/api/v2/search/hash"
HYBRID_ANALYSIS_HEADERS = {"User-Agent": "Falcon Sandbox"}

# Function to extract the root domain
def extract_root_domain(domain):
    domain = domain.lower().strip()
    if domain.startswith("www."):
        domain = domain[4:]
    match = re.search(r"([a-z0-9-]+\.[a-z]+)$", domain)
    return match.group(1) if match else domain

try:
    es = Elasticsearch(
        [ELASTICSEARCH_URL],
        basic_auth=(USERNAME, PASSWORD),
        verify_certs=False
    )
    
    if es.ping():
        print("✅ Connected to Elasticsearch successfully!")
    else:
        print("❌ Failed to connect to Elasticsearch.")
        exit(1)
    
    class TrieNode:
        def __init__(self):
            self.children = defaultdict(TrieNode)
            self.is_end = False

    class DomainTrie:
        def __init__(self):
            self.root = TrieNode()

        def insert(self, domain):
            node = self.root
            for char in domain:
                node = node.children[char]
            node.is_end = True

        def search(self, domain):
            node = self.root
            for char in domain:
                if char not in node.children:
                    return False
                node = node.children[char]
            return node.is_end

    restricted_domains = DomainTrie()
    try:
        with open(RESTRICTED_DOMAINS_FILE, "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    cleaned_domain = extract_root_domain(row[0].strip().lower())
                    restricted_domains.insert(cleaned_domain)
        print("✅ Loaded restricted domains into Trie.")
    except FileNotFoundError:
        print(f"❌ CSV file '{RESTRICTED_DOMAINS_FILE}' not found!")
        exit(1)

    search_query = {
        "size": 100,
        "_source": [URL_FIELD],
        "query": {"exists": {"field": URL_FIELD}},
        "sort": [{"@timestamp": {"order": "desc"}}]
    }

    response = es.search(index=INDEX_NAME, body=search_query)
    logs = response.get("hits", {}).get("hits", [])

    surfed_domains = set()
    for log in logs:
        source = log.get("_source", {})
        destination_data = source.get("destination", {})
        domain_value = destination_data.get("domain", "N/A")
        if domain_value and isinstance(domain_value, str) and domain_value != "N/A":
            root_domain = extract_root_domain(domain_value)
            surfed_domains.add(root_domain)

    if not surfed_domains:
        print("❌ No website domains found in Elasticsearch.")
        exit(1)

    print(f"\n✅ Fetched {len(surfed_domains)} unique surfed domains.\n")

    matched_domains = {domain for domain in surfed_domains if restricted_domains.search(domain)}

    if matched_domains:
        print(f"⚠️ {len(matched_domains)} restricted domains were accessed!")
        for domain in matched_domains:
            print(f"🚨 Restricted domain detected: {domain}")
        with open(LOG_FILE, "w", encoding="utf-8") as file:
            file.write("\n".join(sorted(matched_domains)))
        print(f"✅ Matched restricted domains saved to '{LOG_FILE}'.")
    else:
        print("✅ No restricted domains were accessed.")

    # Check each domain with Hybrid Analysis
    for domain in surfed_domains:
        response = requests.get(f"https://www.hybrid-analysis.com/api/v2/search/domain/{domain}", headers=HYBRID_ANALYSIS_HEADERS)
        if response.status_code == 200:
            results = response.json()
            if results.get("threat_score", 0) > 0:
                print(f"⚠️ Threat detected for domain {domain}: {results.get('verdict', 'Unknown')}")
        else:
            print(f"⚠️ Error checking {domain} on Hybrid Analysis: {response.status_code}")

except AuthenticationException:
    print("❌ Authentication failed! Check your username and password.")
except ConnectionError as e:
    print(f"❌ Connection error! Check if Elasticsearch is running and accessible.\nDetails: {e}")
except ApiError as e:
    print(f"❌ API error! Something is wrong with your request.\nDetails: {e}")
except Exception as e:
    print(f"❌ An unexpected error occurred:\n{e}")
