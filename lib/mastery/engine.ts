import type {MisconceptionCode} from '../../content/curriculum';
export const dimensions=['conceptual','procedural','explanation','correction','transfer'] as const;
export type Dimension=typeof dimensions[number];
export type MasteryState=Record<Dimension,number>;
export type MisconceptionState={code:MisconceptionCode;confidence:number;observations:number;resolvedAt?:string};
export type Evidence={id:string;dimension:Dimension;score:number;reliability:number;source:string;at:string};
export const baseline=(value=.35):MasteryState=>({conceptual:value,procedural:value,explanation:value,correction:value,transfer:value});
const clamp=(n:number)=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function updateMastery(state:MasteryState,e:Evidence):MasteryState{const score=clamp(e.score),alpha=score<.5?.45:.3;return {...state,[e.dimension]:clamp(state[e.dimension]+alpha*clamp(e.reliability)*(score-state[e.dimension]))};}
export function overall(s:MasteryState){const weighted=s.conceptual*.27+s.procedural*.18+s.explanation*.2+s.correction*.15+s.transfer*.2;return weighted*.65+Math.min(s.conceptual,s.explanation,s.transfer)*.35;}
export function isMastered(s:MasteryState,mis:MisconceptionState[]=[]){return overall(s)>=.82&&s.conceptual>=.75&&s.explanation>=.7&&s.transfer>=.75&&s.correction>=.7&&!mis.some(m=>m.confidence>=.65&&!m.resolvedAt);}
export function reliability(hints:number,attempts:number){return clamp(([1,.9,.75,.55][Math.min(hints,3)]??.55)*Math.max(.35,1-attempts*.13));}
export function updateMisconception(previous:MisconceptionState|undefined,code:MisconceptionCode,confidence:number,contradicted=false):MisconceptionState{const next=contradicted?(previous?.confidence??.35)*.35:Math.max(previous?.confidence??0,clamp(confidence));return {code,confidence:next,observations:(previous?.observations??0)+1,...(contradicted&&next<.3?{resolvedAt:new Date().toISOString()}:{} )};}
export function nextAction(s:MasteryState,mis:MisconceptionState[],transferFailed=false){if(isMastered(s,mis))return 'mastery';if(mis.some(m=>m.confidence>=.65&&!m.resolvedAt))return 'correct';if(transferFailed)return 'alternate-representation';if(s.procedural>s.explanation+.12)return 'explain';if(s.conceptual>=.75&&s.explanation>=.7&&s.correction>=.7)return 'transfer';return 'build';}
