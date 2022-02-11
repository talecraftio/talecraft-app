import json
import time

import requests
from brownie.network import Chain
from brownie.network.contract import Contract
from brownie.utils import color


def sourcify_publish(c: Contract):
    s = requests.Session()
    build_json = c._build
    print(f'Sourcifying {build_json["contractName"]} at {c.address}...')
    metadata = json.loads(build_json['metadata'])
    s.post('https://sourcify.dev/server/restart-session')
    s.post('https://sourcify.dev/server/input-files', json={'files': {'metadata.json': build_json['metadata']}})
    session_data = s.get('https://sourcify.dev/server/session-data').json()
    for source_path, source_info in metadata['sources'].items():
        with open(source_path) as source_f:
            s.post('https://sourcify.dev/server/input-files', json={'files': {source_path: source_f.read(),}})
    r = s.post('https://sourcify.dev/server/verify-validated', json={
        'contracts': [
            {
                'address': c.address,
                'chainId': str(Chain().id),
                'verificationId': session_data['contracts'][0]['verificationId'],
                'compilerVersion': metadata['compiler']['version'],
            },
        ],
    })
    result = r.json()
    if 'error' in result:
        print(f'{c.address} Sourcify error: "{result["error"]}"')
    else:
        result = result['contracts'][0]
        print(f'{c.address} Sourcify status: "{result["status"]}"')


def avascan_publish(c: Contract):
    s = requests.Session()
    build_json = c._build
    print(f'Sourcifying {build_json["contractName"]} at {c.address}...')
    metadata = json.loads(build_json['metadata'])
    input_json = build_json['input_json']
    for source_path, source_info in metadata['sources'].items():
        with open(source_path) as source_f:
            input_json['sources'][source_path] = source_f.read()
    # print({
    #     'address': c.address,
    #     'solc': {
    #         'version': metadata['compiler']['version'],
    #         'options': input_json,
    #     },
    # })
    r = s.post('https://testnet.avascan.info/api/v1/verify-contract', json={
        'address': c.address,
        'solc': {
            'version': metadata['compiler']['version'],
            'options': input_json,
        },
    })
    result = r.json()
    print(result)


SNOWTRACE_KEY = '8MSW7WG86KADW7CQDRAT9FM4422DFYB7GR'
SNOWTRACE_TESTNET = Chain().id == 43113
print(SNOWTRACE_TESTNET)
SNOWTRACE_API_URL = 'https://api-testnet.snowtrace.io/api' if SNOWTRACE_TESTNET else 'https://api.snowtrace.io/api'


def snowtrace_publish(c: Contract):
    s = requests.Session()
    build_json = c._build
    print(f'Sourcifying {build_json["contractName"]} at {c.address}...')
    metadata = json.loads(build_json['metadata'])
    input_json = build_json['input_json']
    input_json['sources'] = {}
    for source_path, source_info in metadata['sources'].items():
        with open(source_path) as source_f:
            input_json['sources'][source_path] = {'content': source_f.read()}

    params_tx = {
        "apikey": SNOWTRACE_KEY,
        "module": "account",
        "action": "txlist",
        "address": c.address,
        "page": 1,
        "sort": "asc",
        "offset": 1,
    }
    i = 0
    while True:
        response = requests.get(SNOWTRACE_API_URL, params=params_tx)
        if response.status_code != 200:
            raise ConnectionError(
                f"Status {response.status_code} when querying {SNOWTRACE_API_URL}: {response.text}"
            )
        data = response.json()
        # print(data)
        if int(data["status"]) == 1:
            # Constructor arguments received
            break
        else:
            # Wait for contract to be recognized by etherscan
            # This takes a few seconds after the contract is deployed
            # After 10 loops we throw with the API result message (includes address)
            if i >= 10:
                raise ValueError(f"API request failed with: {data['result']}")
            elif i == 0:
                print(f"Waiting for {SNOWTRACE_API_URL} to process contract...")
            i += 1
            time.sleep(5)

    if data["message"] == "OK":
        constructor_arguments = data["result"][0]["input"][len(build_json['bytecode']) + 2:]
    else:
        constructor_arguments = ""

    params = {
        'apikey': SNOWTRACE_KEY,
        'module': 'contract',
        'action': 'verifysourcecode',
        'contractaddress': c.address,
        'sourceCode': json.dumps(input_json),
        'codeformat': 'solidity-standard-json-input',
        'contractname': build_json['sourcePath'] + ':' + build_json['contractName'],
        'compilerversion': 'v' + metadata['compiler']['version'],
        'constructorArguements': constructor_arguments,
        'evmversion': '',
        'licenseType': 1
    }
    r = s.post(SNOWTRACE_API_URL, params)
    print(r.json())

    guid = r.json()["result"]
    print("Verification submitted successfully. Waiting for result...")
    time.sleep(5)
    params_status = {
        "apikey": SNOWTRACE_KEY,
        "module": "contract",
        "action": "checkverifystatus",
        "guid": guid,
    }
    while True:
        response = requests.get(SNOWTRACE_API_URL, params=params_status)
        if response.status_code != 200:
            raise ConnectionError(
                f"Status {response.status_code} when querying {SNOWTRACE_API_URL}: {response.text}"
            )
        data = response.json()
        if data["result"] == "Pending in queue":
            print("Verification pending...")
        else:
            print(data)
            col = "bright green" if data["message"] == "OK" else "bright red"
            print(f"Verification complete. Result: {color(col)}{data['result']}{color}")
            return data["message"] == "OK"
        time.sleep(5)



