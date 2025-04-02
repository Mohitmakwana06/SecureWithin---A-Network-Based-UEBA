from elasticsearch import Elasticsearch

ELASTICSEARCH_URL = "https://localhost:9200"  # Ensure HTTPS is used
USERNAME = "elastic"
PASSWORD = "OU=7ze4HXE1ihPOptGBC"

# Elasticsearch connection
es = Elasticsearch(
        [ELASTICSEARCH_URL],
        basic_auth=(USERNAME, PASSWORD),  # Authentication
        verify_certs=False  # Set to True for security (if using a valid SSL cert)
    )  # Update with your ES instance

def get_logs(index_name: str, client_id: str):
    try:
        query = {
            "query": {
                "match": {
                    "client_id": client_id
                }
            },
            "size": 100  # Limit results to 100 logs
        }
        
        response = es.search(index=index_name, body=query)
        logs = [hit["_source"] for hit in response["hits"]["hits"]]
        
        return {"logs": logs}
    except Exception as e:
        return {"error": str(e)}
# Example usage
if __name__ == "__main__":
    index_name = "proxy-logs"
    client_id = "clientA"
    print(get_logs(index_name, client_id))
