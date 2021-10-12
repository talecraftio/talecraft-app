import json

import requests
from brownie.network import Chain
from brownie.network.contract import Contract


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
