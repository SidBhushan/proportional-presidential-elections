import requests
import json
import csv

geo_json = {
    "type": "FeatureCollection",
    "features": []
}

states = open('states.csv', 'r').read().split('\n')

for state in states:
    r = requests.get(f'https://boundaries.io/geographies/states?search={state}',
                     headers={
                         'Accept': 'application/json'
                     })
    data = r.json()
    geo_json["features"].append(data)
    print(f'Got data for: {state}')

with open('output.json', 'w') as output_json:
    output_json.write(json.dumps(geo_json))
