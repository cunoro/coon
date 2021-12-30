/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Distributor, DistributorInterface } from "../Distributor";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_treasury",
        type: "address",
      },
      {
        internalType: "address",
        name: "_noro",
        type: "address",
      },
      {
        internalType: "address",
        name: "_staking",
        type: "address",
      },
      {
        internalType: "address",
        name: "_authority",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract ICunoroAuthority",
        name: "authority",
        type: "address",
      },
    ],
    name: "AuthorityUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_rewardRate",
        type: "uint256",
      },
    ],
    name: "addRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "adjustments",
    outputs: [
      {
        internalType: "bool",
        name: "add",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "target",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "authority",
    outputs: [
      {
        internalType: "contract ICunoroAuthority",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bounty",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "distribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "info",
    outputs: [
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rate",
        type: "uint256",
      },
    ],
    name: "nextRewardAt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "nextRewardFor",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "removeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "retrieveBounty",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_add",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_rate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_target",
        type: "uint256",
      },
    ],
    name: "setAdjustment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ICunoroAuthority",
        name: "_newAuthority",
        type: "address",
      },
    ],
    name: "setAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_bounty",
        type: "uint256",
      },
    ],
    name: "setBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x610140604052600c6101008190526b15539055551213d49256915160a21b61012090815262000032916000919062000217565b50620f424060e0523480156200004757600080fd5b5060405162001a0d38038062001a0d833981810160405260808110156200006d57600080fd5b5080516020820151604080840151606090940151600180546001600160a01b0319166001600160a01b038316908117909155915193949293909182917f2f658b440c35314f52658ea8a740e05b284cdc84dc9ae01e891f21b8933e7cad90600090a2506001600160a01b0384166200012c576040805162461bcd60e51b815260206004820152601660248201527f5a65726f20616464726573733a20547265617375727900000000000000000000604482015290519081900360640190fd5b6001600160601b0319606085901b1660a0526001600160a01b0383166200018f576040805162461bcd60e51b81526020600482015260126024820152715a65726f20616464726573733a204e4f524f60701b604482015290519081900360640190fd5b6001600160601b0319606084901b166080526001600160a01b038216620001fd576040805162461bcd60e51b815260206004820152601560248201527f5a65726f20616464726573733a205374616b696e670000000000000000000000604482015290519081900360640190fd5b5060601b6001600160601b03191660c05250620002c39050565b828054600181600116156101000203166002900490600052602060002090601f0160209004810192826200024f57600085556200029a565b82601f106200026a57805160ff19168380011785556200029a565b828001600101855582156200029a579182015b828111156200029a5782518255916020019190600101906200027d565b50620002a8929150620002ac565b5090565b5b80821115620002a85760008155600101620002ad565b60805160601c60a05160601c60c05160601c60e0516116f76200031660003980610c4552806110f4525080610d045280610e895280610f23525080610d9b5280610ef4525080610c6a52506116f76000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c8063943dfef11161008c578063c9fa8b2a11610066578063c9fa8b2a14610256578063e4fc6b6d14610273578063e7187e8a1461027b578063f798224314610283576100df565b8063943dfef1146101ed578063bc3b2b12146101f5578063bf7e214f14610232576100df565b80635db854b0116100bd5780635db854b0146101795780637a9e5e4b146101aa5780638e69e255146101d0576100df565b80632e340599146100e457806336d33f44146101225780635d87d3631461015a575b600080fd5b610101600480360360208110156100fa57600080fd5b50356102af565b604080519283526001600160a01b0390911660208301528051918290030190f35b6101486004803603602081101561013857600080fd5b50356001600160a01b03166102e6565b60408051918252519081900360200190f35b6101776004803603602081101561017057600080fd5b5035610373565b005b6101776004803603608081101561018f57600080fd5b508035906020810135151590604081013590606001356104f7565b610177600480360360208110156101c057600080fd5b50356001600160a01b0316610885565b610177600480360360208110156101e657600080fd5b50356109c8565b610148610c03565b6102126004803603602081101561020b57600080fd5b5035610c09565b604080519315158452602084019290925282820152519081900360600190f35b61023a610c2f565b604080516001600160a01b039092168252519081900360200190f35b6101486004803603602081101561026c57600080fd5b5035610c3e565b610177610cf9565b610148610e7c565b6101776004803603604081101561029957600080fd5b506001600160a01b038135169060200135610fab565b600481815481106102bf57600080fd5b6000918252602090912060029091020180546001909101549091506001600160a01b031682565b60008060005b60045481101561036c57836001600160a01b03166004828154811061030d57fe5b60009182526020909120600160029092020101546001600160a01b031614156103645761036161035a6004838154811061034357fe5b906000526020600020906002020160000154610c3e565b8390611209565b91505b6001016102ec565b5092915050565b600160009054906101000a90046001600160a01b03166001600160a01b0316630c340a246040518163ffffffff1660e01b815260040160206040518083038186803b1580156103c157600080fd5b505afa1580156103d5573d6000803e3d6000fd5b505050506040513d60208110156103eb57600080fd5b50516000906001600160a01b031633146104985760405162461bcd60e51b81526020600482019081528254600260001961010060018416150201909116046024830181905290918291604490910190849080156104895780601f1061045e57610100808354040283529160200191610489565b820191906000526020600020905b81548152906001019060200180831161046c57829003601f168201915b50509250505060405180910390fd5b5063773594008111156104f2576040805162461bcd60e51b815260206004820152600860248201527f546f6f206d756368000000000000000000000000000000000000000000000000604482015290519081900360640190fd5b600355565b600160009054906101000a90046001600160a01b03166001600160a01b0316630c340a246040518163ffffffff1660e01b815260040160206040518083038186803b15801561054557600080fd5b505afa158015610559573d6000803e3d6000fd5b505050506040513d602081101561056f57600080fd5b50516001600160a01b03163314806106085750600160009054906101000a90046001600160a01b03166001600160a01b031663452a93206040518163ffffffff1660e01b815260040160206040518083038186803b1580156105d057600080fd5b505afa1580156105e4573d6000803e3d6000fd5b505050506040513d60208110156105fa57600080fd5b50516001600160a01b031633145b6106435760405162461bcd60e51b81526004018080602001828103825260228152602001806116796022913960400191505060405180910390fd5b60006001600160a01b03166004858154811061065b57fe5b60009182526020909120600160029092020101546001600160a01b031614156106cb576040805162461bcd60e51b815260206004820152601860248201527f526563697069656e7420646f6573206e6f742065786973740000000000000000604482015290519081900360640190fd5b600160009054906101000a90046001600160a01b03166001600160a01b031663452a93206040518163ffffffff1660e01b815260040160206040518083038186803b15801561071957600080fd5b505afa15801561072d573d6000803e3d6000fd5b505050506040513d602081101561074357600080fd5b50516001600160a01b03163314156107de5761078a6103e861078460196004888154811061076d57fe5b60009182526020909120600290910201549061126a565b906112c3565b8211156107de576040805162461bcd60e51b815260206004820152601f60248201527f4c696d697465723a2063616e6e6f742061646a757374206279203e322e352500604482015290519081900360640190fd5b8261084057600484815481106107f057fe5b9060005260206000209060020201600001548211156108405760405162461bcd60e51b815260040180806020018281038252602f8152602001806116bc602f913960400191505060405180910390fd5b6040805160608101825293151584526020808501938452848201928352600095865260029081905294209251835460ff19169015151783559051600183015551910155565b600160009054906101000a90046001600160a01b03166001600160a01b0316630c340a246040518163ffffffff1660e01b815260040160206040518083038186803b1580156108d357600080fd5b505afa1580156108e7573d6000803e3d6000fd5b505050506040513d60208110156108fd57600080fd5b50516000906001600160a01b031633146109705760405162461bcd60e51b81526020600482019081528254600260001961010060018416150201909116046024830181905290918291604490910190849080156104895780601f1061045e57610100808354040283529160200191610489565b506001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383169081179091556040517f2f658b440c35314f52658ea8a740e05b284cdc84dc9ae01e891f21b8933e7cad90600090a250565b600160009054906101000a90046001600160a01b03166001600160a01b0316630c340a246040518163ffffffff1660e01b815260040160206040518083038186803b158015610a1657600080fd5b505afa158015610a2a573d6000803e3d6000fd5b505050506040513d6020811015610a4057600080fd5b50516001600160a01b0316331480610ad95750600160009054906101000a90046001600160a01b03166001600160a01b031663452a93206040518163ffffffff1660e01b815260040160206040518083038186803b158015610aa157600080fd5b505afa158015610ab5573d6000803e3d6000fd5b505050506040513d6020811015610acb57600080fd5b50516001600160a01b031633145b610b145760405162461bcd60e51b81526004018080602001828103825260228152602001806116796022913960400191505060405180910390fd5b60006001600160a01b031660048281548110610b2c57fe5b60009182526020909120600160029092020101546001600160a01b03161415610b9c576040805162461bcd60e51b815260206004820152601860248201527f526563697069656e7420646f6573206e6f742065786973740000000000000000604482015290519081900360640190fd5b600060048281548110610bab57fe5b906000526020600020906002020160010160006101000a8154816001600160a01b0302191690836001600160a01b03160217905550600060048281548110610bef57fe5b600091825260209091206002909102015550565b60035481565b600260208190526000918252604090912080546001820154919092015460ff9092169183565b6001546001600160a01b031681565b6000610cf37f0000000000000000000000000000000000000000000000000000000000000000610784847f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b158015610cc157600080fd5b505afa158015610cd5573d6000803e3d6000fd5b505050506040513d6020811015610ceb57600080fd5b50519061126a565b92915050565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610d65576040805162461bcd60e51b815260206004820152600c60248201526b4f6e6c79207374616b696e6760a01b604482015290519081900360640190fd5b60005b600454811015610e7957600060048281548110610d8157fe5b9060005260206000209060020201600001541115610e71577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166340c10f1960048381548110610dd557fe5b906000526020600020906002020160010160009054906101000a90046001600160a01b0316610e0a6004858154811061034357fe5b6040518363ffffffff1660e01b815260040180836001600160a01b0316815260200182815260200192505050600060405180830381600087803b158015610e5057600080fd5b505af1158015610e64573d6000803e3d6000fd5b50505050610e7181611305565b600101610d68565b50565b6000336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610eea576040805162461bcd60e51b815260206004820152600c60248201526b4f6e6c79207374616b696e6760a01b604482015290519081900360640190fd5b60035415610fa4577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166340c10f197f00000000000000000000000000000000000000000000000000000000000000006003546040518363ffffffff1660e01b815260040180836001600160a01b0316815260200182815260200192505050600060405180830381600087803b158015610f8b57600080fd5b505af1158015610f9f573d6000803e3d6000fd5b505050505b5060035490565b600160009054906101000a90046001600160a01b03166001600160a01b0316630c340a246040518163ffffffff1660e01b815260040160206040518083038186803b158015610ff957600080fd5b505afa15801561100d573d6000803e3d6000fd5b505050506040513d602081101561102357600080fd5b50516000906001600160a01b031633146110965760405162461bcd60e51b81526020600482019081528254600260001961010060018416150201909116046024830181905290918291604490910190849080156104895780601f1061045e57610100808354040283529160200191610489565b506001600160a01b0382166110f2576040805162461bcd60e51b815260206004820152601760248201527f5a65726f20616464726573733a20526563697069656e74000000000000000000604482015290519081900360640190fd5b7f0000000000000000000000000000000000000000000000000000000000000000811115611167576040805162461bcd60e51b815260206004820152601e60248201527f526174652063616e6e6f74206578636565642064656e6f6d696e61746f720000604482015290519081900360640190fd5b604080518082019091529081526001600160a01b03918216602082019081526004805460018101825560009190915291517f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b600290930292830155517f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19c909101805473ffffffffffffffffffffffffffffffffffffffff191691909216179055565b600082820183811015611263576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b60008261127957506000610cf3565b8282028284828161128657fe5b04146112635760405162461bcd60e51b815260040180806020018281038252602181526020018061169b6021913960400191505060405180910390fd5b600061126383836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250611505565b61130d611655565b506000818152600260208181526040928390208351606081018552815460ff16151581526001820154928101839052920154928201929092529015611501578051156114055761137f81602001516004848154811061136857fe5b600091825260209091206002909102015490611209565b6004838154811061138c57fe5b6000918252602090912060029091020155604081015160048054849081106113b057fe5b90600052602060002090600202016000015410611400576000828152600260205260408082206001019190915581015160048054849081106113ee57fe5b60009182526020909120600290910201555b611501565b80602001516004838154811061141757fe5b906000526020600020906002020160000154111561147e5761145b81602001516004848154811061144457fe5b6000918252602090912060029091020154906115be565b6004838154811061146857fe5b600091825260209091206002909102015561149f565b60006004838154811061148d57fe5b60009182526020909120600290910201555b8060400151600483815481106114b157fe5b90600052602060002090600202016000015411611501576000828152600260205260408082206001019190915581015160048054849081106114ef57fe5b60009182526020909120600290910201555b5050565b600081836115915760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561155657818101518382015260200161153e565b50505050905090810190601f1680156115835780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50600083858161159d57fe5b0490508385816115a957fe5b068185020185146115b657fe5b949350505050565b600061126383836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506000818484111561164d5760405162461bcd60e51b815260206004820181815283516024840152835190928392604490910191908501908083836000831561155657818101518382015260200161153e565b505050900390565b60405180606001604052806000151581526020016000815260200160008152509056fe43616c6c6572206973206e6f7420676f7665726e6f72206f7220677561726469616e536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7743616e6e6f742064656372656173652072617465206279206d6f7265207468616e20697420616c7265616479206973a164736f6c6343000705000a";

export class Distributor__factory extends ContractFactory {
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
    _treasury: string,
    _noro: string,
    _staking: string,
    _authority: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Distributor> {
    return super.deploy(
      _treasury,
      _noro,
      _staking,
      _authority,
      overrides || {}
    ) as Promise<Distributor>;
  }
  getDeployTransaction(
    _treasury: string,
    _noro: string,
    _staking: string,
    _authority: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _treasury,
      _noro,
      _staking,
      _authority,
      overrides || {}
    );
  }
  attach(address: string): Distributor {
    return super.attach(address) as Distributor;
  }
  connect(signer: Signer): Distributor__factory {
    return super.connect(signer) as Distributor__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DistributorInterface {
    return new utils.Interface(_abi) as DistributorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Distributor {
    return new Contract(address, _abi, signerOrProvider) as Distributor;
  }
}
