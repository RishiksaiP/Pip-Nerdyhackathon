import {describe,it,expect} from 'vitest';
import {compareFractions,validateBuild,equivalent,multiply,compose,decompose,comparisonKernel} from '../../lib/math/kernel';
describe('exact mathematical truth',()=>{
 it('compares 1/8 and 1/4, and 2/3 and 3/4 exactly',()=>{expect(compareFractions({n:1,d:8},{n:1,d:4})).toBe('right');expect(compareFractions({n:2,d:3},{n:3,d:4})).toBe('right');});
 it('checks hundreds of kernels with an independent rational oracle',()=>{for(let d=1;d<=12;d++)for(let n=0;n<=d;n++)for(let b=1;b<=12;b++){const a={n,d},right={n:1,d:b};const delta=BigInt(n)*BigInt(b)-BigInt(d);expect(compareFractions(a,right)).toBe(delta===0n?'equal':delta>0n?'left':'right');}});
 it('checks equivalence without floating point',()=>{expect(equivalent({n:2,d:4},{n:1,d:2})).toBe(true);expect(validateBuild(3,4,{n:3,d:4})).toBe(true);expect(validateBuild(2,4,{n:3,d:4})).toBe(false);expect(validateBuild(5,4,{n:5,d:4})).toBe(false);});
 it('rejects invalid operands',()=>{for(const f of [{n:1,d:0},{n:-1,d:4},{n:1.5,d:3},{n:1,d:Infinity},{n:1,d:1e10}])expect(()=>compareFractions(f,{n:1,d:4})).toThrow();});
 it('freezes canonical transfer math',()=>{const k=comparisonKernel({n:2,d:3},{n:3,d:4});expect(Object.isFrozen(k)).toBe(true);expect(Object.isFrozen(k.left)).toBe(true);expect(()=>Object.assign(k,{answer:'left'})).toThrow();});
 it('composes and decomposes every three-digit number',()=>{for(let i=0;i<=999;i++){const p=decompose(i);expect(compose(p.hundreds,p.tens,p.ones)).toBe(i);}expect(compose(2,0,3)).toBe(203);expect(()=>compose(1,10,0)).toThrow();});
 it('multiplication counts all array cells',()=>{for(let r=0;r<=10;r++)for(let c=0;c<=10;c++)expect(multiply(r,c)).toBe(Array.from({length:r},()=>c).reduce((a,b)=>a+b,0));expect(()=>multiply(-1,4)).toThrow();});
});
