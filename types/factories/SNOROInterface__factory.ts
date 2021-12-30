/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  SNOROInterface,
  SNOROInterfaceInterface,
} from "../SNOROInterface";

const _abi = [
  {
    constant: true,
    inputs: [],
    name: "circulatingSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export class SNOROInterface__factory {
  static readonly abi = _abi;
  static createInterface(): SNOROInterfaceInterface {
    return new utils.Interface(_abi) as SNOROInterfaceInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SNOROInterface {
    return new Contract(address, _abi, signerOrProvider) as SNOROInterface;
  }
}
