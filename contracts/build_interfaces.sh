#!/bin/bash

node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/chest.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/resource.abi.json --output ../frontend/src/utils/contracts
node ../frontend/node_modules/.bin/abi-types-generator ../frontend/src/utils/contracts/phi.abi.json --output ../frontend/src/utils/contracts
