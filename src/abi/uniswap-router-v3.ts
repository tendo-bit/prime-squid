import * as ethers from 'ethers'
import {LogEvent, Func, ContractBase} from './abi.support'
import {ABI_JSON} from './uniswap-router-v3.abi'

export const abi = new ethers.Interface(ABI_JSON);

export const functions = {
    WETH9: new Func<[], {}, string>(
        abi, '0x4aa4a4fc'
    ),
    exactInput: new Func<[params: ([path: string, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint] & {path: string, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint})], {params: ([path: string, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint] & {path: string, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint})}, bigint>(
        abi, '0xc04b8d59'
    ),
    exactInputSingle: new Func<[params: ([tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint, sqrtPriceLimitX96: bigint] & {tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint, sqrtPriceLimitX96: bigint})], {params: ([tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint, sqrtPriceLimitX96: bigint] & {tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountIn: bigint, amountOutMinimum: bigint, sqrtPriceLimitX96: bigint})}, bigint>(
        abi, '0x414bf389'
    ),
    exactOutput: new Func<[params: ([path: string, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint] & {path: string, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint})], {params: ([path: string, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint] & {path: string, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint})}, bigint>(
        abi, '0xf28c0498'
    ),
    exactOutputSingle: new Func<[params: ([tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint, sqrtPriceLimitX96: bigint] & {tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint, sqrtPriceLimitX96: bigint})], {params: ([tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint, sqrtPriceLimitX96: bigint] & {tokenIn: string, tokenOut: string, fee: number, recipient: string, deadline: bigint, amountOut: bigint, amountInMaximum: bigint, sqrtPriceLimitX96: bigint})}, bigint>(
        abi, '0xdb3e2198'
    ),
    factory: new Func<[], {}, string>(
        abi, '0xc45a0155'
    ),
    multicall: new Func<[data: Array<string>], {data: Array<string>}, Array<string>>(
        abi, '0xac9650d8'
    ),
    refundETH: new Func<[], {}, []>(
        abi, '0x12210e8a'
    ),
    selfPermit: new Func<[token: string, value: bigint, deadline: bigint, v: number, r: string, s: string], {token: string, value: bigint, deadline: bigint, v: number, r: string, s: string}, []>(
        abi, '0xf3995c67'
    ),
    selfPermitAllowed: new Func<[token: string, nonce: bigint, expiry: bigint, v: number, r: string, s: string], {token: string, nonce: bigint, expiry: bigint, v: number, r: string, s: string}, []>(
        abi, '0x4659a494'
    ),
    selfPermitAllowedIfNecessary: new Func<[token: string, nonce: bigint, expiry: bigint, v: number, r: string, s: string], {token: string, nonce: bigint, expiry: bigint, v: number, r: string, s: string}, []>(
        abi, '0xa4a78f0c'
    ),
    selfPermitIfNecessary: new Func<[token: string, value: bigint, deadline: bigint, v: number, r: string, s: string], {token: string, value: bigint, deadline: bigint, v: number, r: string, s: string}, []>(
        abi, '0xc2e3140a'
    ),
    sweepToken: new Func<[token: string, amountMinimum: bigint, recipient: string], {token: string, amountMinimum: bigint, recipient: string}, []>(
        abi, '0xdf2ab5bb'
    ),
    sweepTokenWithFee: new Func<[token: string, amountMinimum: bigint, recipient: string, feeBips: bigint, feeRecipient: string], {token: string, amountMinimum: bigint, recipient: string, feeBips: bigint, feeRecipient: string}, []>(
        abi, '0xe0e189a0'
    ),
    uniswapV3SwapCallback: new Func<[amount0Delta: bigint, amount1Delta: bigint, _data: string], {amount0Delta: bigint, amount1Delta: bigint, _data: string}, []>(
        abi, '0xfa461e33'
    ),
    unwrapWETH9: new Func<[amountMinimum: bigint, recipient: string], {amountMinimum: bigint, recipient: string}, []>(
        abi, '0x49404b7c'
    ),
    unwrapWETH9WithFee: new Func<[amountMinimum: bigint, recipient: string, feeBips: bigint, feeRecipient: string], {amountMinimum: bigint, recipient: string, feeBips: bigint, feeRecipient: string}, []>(
        abi, '0x9b2c0a37'
    ),
}

export class Contract extends ContractBase {

    WETH9(): Promise<string> {
        return this.eth_call(functions.WETH9, [])
    }

    factory(): Promise<string> {
        return this.eth_call(functions.factory, [])
    }
}
