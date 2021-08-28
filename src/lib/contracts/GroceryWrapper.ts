import Web3 from 'web3';
import * as GroceryJSON from '../../../build/contracts/Grocery.json';

import { Grocery } from '../../types/Grocery';
import { GROCERY_CONTRACT_ADDRESS } from '../../ui/constants';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class GroceryWrapper {
    web3: Web3;

    contract: Grocery;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.address = GROCERY_CONTRACT_ADDRESS;
        this.contract = new web3.eth.Contract(GroceryJSON.abi as any) as any;
        this.contract.options.address = GROCERY_CONTRACT_ADDRESS;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getItemQty(id: number, fromAddress: string) {
        const item = await this.contract.methods.items(id).call({ from: fromAddress });

        return parseInt(item.qty, 10);
    }

    async changeQty(id: number, newQty: number, fromAddress: string) {
        const tx = await this.contract.methods.changeQty(id, newQty).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const tx = this.contract
            .deploy({
                data: GroceryJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        let transactionHash: string = null;
        tx.on('transactionHash', (hash: string) => {
            transactionHash = hash;
        });

        const contract = await tx;

        this.useDeployed(contract.options.address);

        return transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
