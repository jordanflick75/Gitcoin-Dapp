/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { GroceryWrapper } from '../lib/contracts/GroceryWrapper';
import { CONFIG } from '../config';
import { GROCERY_CONTRACT_ADDRESS } from './constants';

const ITEMS = [
    {
        name: 'Apple',
        url:
            'https://freepngimg.com/download/apple/72089-tomato-apple-plum-two-fuji-vector-apples.png',
        index: 0
    },
    {
        name: 'Carrot',
        url: 'https://www.pngall.com/wp-content/uploads/2016/04/Carrot-Download-PNG.png',
        index: 1
    },
    {
        name: 'Orange',
        url:
            'https://www.freepnglogos.com/uploads/orange-png/orange-png-image-purepng-transparent-png-29.png',
        index: 2
    }
];
async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<GroceryWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();

    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);

    const [selectedItemId, setSelectedItemId] = useState<number>();

    const [qty, setQty] = useState<number>();

    const [qtyList, setQtyList] = useState<number[]>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (contract && accounts) getAllItemQty();
    }, [contract, accounts]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function getAllItemQty() {
        setQtyList(undefined);
        const ITEM_SIZE = 3;

        let i = 1;
        const _qtyList = [];
        while (i <= ITEM_SIZE) {
            const itemQty = await contract.getItemQty(i, account);
            _qtyList.push(itemQty);
            i++;
        }
        setQtyList(_qtyList);
        toast('Successfully read item quantities', { type: 'success' });
    }

    async function changeQty() {
        try {
            setTransactionInProgress(true);
            console.log('step1');
            await contract.changeQty(selectedItemId, qty, account);
            console.log('step2');
            toast('Successfully edited item quantity', { type: 'success' });

            await getAllItemQty();
            console.log('step3');
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            const _contract = new GroceryWrapper(_web3);
            setContract(_contract);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{GROCERY_CONTRACT_ADDRESS}</b> <br />
            <br />
            <hr />
            <br />
            <br />
            <div>
                <select
                    name="items"
                    id="items"
                    onChange={e => setSelectedItemId(Number(e.target.value))}
                >
                    {ITEMS.map(item => (
                        <option key={item.index} value={item.index + 1}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <input
                    placeholder="New quantity"
                    type="number"
                    value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                />
                <button onClick={changeQty}>Change Quantity</button>
            </div>
            <div className="grocery">
                {ITEMS.map(item => {
                    return (
                        <div key={item.name}>
                            <h3>{item.name}</h3>
                            <img
                                alt="item"
                                src={item.url}
                                style={{ width: '150px', height: '150px' }}
                            />
                            <p>
                                Total Quantity:{' '}
                                <strong>
                                    {qtyList ? qtyList[item.index] : <LoadingIndicator />}
                                </strong>
                            </p>
                        </div>
                    );
                })}
            </div>
            <ToastContainer />
        </div>
    );
}
