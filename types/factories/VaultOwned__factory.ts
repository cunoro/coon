/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { VaultOwned, VaultOwnedInterface } from "../VaultOwned";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipPulled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipPushed",
    type: "event",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pullManagement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner_",
        type: "address",
      },
    ],
    name: "pushManagement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceManagement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "vault_",
        type: "address",
      },
    ],
    name: "setVault",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50600080546001600160a01b03191633178082556040516001600160a01b039190911691907fea8258f2d9ddb679928cf34b78cf645b7feda9acc828e4dd82d014eaae270eba908290a3610403806100696000396000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c80636817031b116100505780636817031b146100af5780638da5cb5b146100e9578063fbfa77cf1461010d57610072565b8063089208d81461007757806346f68ee9146100815780635a96ac0a146100a7575b600080fd5b61007f610115565b005b61007f6004803603602081101561009757600080fd5b50356001600160a01b03166101ca565b61007f610284565b6100d5600480360360208110156100c557600080fd5b50356001600160a01b0316610331565b604080519115158252519081900360200190f35b6100f16103b6565b604080516001600160a01b039092168252519081900360200190f35b6100f16103c5565b6000546001600160a01b03163314610174576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b600080546040516001600160a01b03909116907faa151555690c956fc3ea32f106bb9f119b5237a061eaa8557cff3e51e3792c8d908390a3600080546001600160a01b0319908116909155600180549091169055565b6000546001600160a01b03163314610229576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b600080546040516001600160a01b03808516939216917fea8258f2d9ddb679928cf34b78cf645b7feda9acc828e4dd82d014eaae270eba91a3600180546001600160a01b0319166001600160a01b0392909216919091179055565b6001546001600160a01b031633146102cd5760405162461bcd60e51b81526004018080602001828103825260228152602001806103d56022913960400191505060405180910390fd5b600154600080546040516001600160a01b0393841693909116917faa151555690c956fc3ea32f106bb9f119b5237a061eaa8557cff3e51e3792c8d91a360018054600080546001600160a01b03199081166001600160a01b03841617909155169055565b600080546001600160a01b03163314610391576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b50600280546001600160a01b0383166001600160a01b03199091161790556001919050565b6000546001600160a01b031690565b6002546001600160a01b03169056fe4f776e61626c653a206d757374206265206e6577206f776e657220746f2070756c6ca164736f6c6343000705000a";

export class VaultOwned__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<VaultOwned> {
    return super.deploy(overrides || {}) as Promise<VaultOwned>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): VaultOwned {
    return super.attach(address) as VaultOwned;
  }
  connect(signer: Signer): VaultOwned__factory {
    return super.connect(signer) as VaultOwned__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): VaultOwnedInterface {
    return new utils.Interface(_abi) as VaultOwnedInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VaultOwned {
    return new Contract(address, _abi, signerOrProvider) as VaultOwned;
  }
}
