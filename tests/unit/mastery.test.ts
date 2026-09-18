import {describe,it,expect} from 'vitest';
import {baseline,dimensions,updateMastery,isMastered,overall,reliability,nextAction,updateMisconception,type Dimension,type MasteryState} from '../../lib/mastery/engine';
import {freshSession,freshRun} from '../../lib/persistence/store';
import {addEvidence,advance,finish} from '../../lib/mastery/session-actions';
function evidence(s:MasteryState,d:Dimension,score:number,r=1){return updateMastery(s,{id:'test',dimension:d,score,reliability:r,source:'test',at:'2026-09-15'});}
describe('mastery gates and attempt quality',()=>{
 it('procedural repetition never proves understanding',()=>{let s=baseline();for(let i=0;i<200;i++)s=evidence(s,'procedural',1);expect(isMastered(s)).toBe(false);expect(overall(s)).toBeLessThan(.5);expect(nextAction(s,[])).toBe('explain');});
 it('requires transfer and explanation',()=>{expect(isMastered({...baseline(.96),transfer:.5})).toBe(false);expect(isMastered({...baseline(.96),explanation:.5})).toBe(false);});
 it('negative evidence updates faster, every dimension stays bounded',()=>{const s=baseline(.5);expect(.5-evidence(s,'conceptual',0).conceptual).toBeGreaterThan(evidence(s,'conceptual',1).conceptual-.5);expect(evidence(s,'conceptual',Infinity).conceptual).toBeGreaterThanOrEqual(0);expect(evidence(s,'conceptual',20,20).conceptual).toBeLessThanOrEqual(1);});
 it('hints and repeated guesses carry less evidence',()=>{expect(reliability(0,0)).toBe(1);expect(reliability(1,0)).toBe(.9);expect(reliability(2,0)).toBe(.75);expect(reliability(3,0)).toBe(.55);expect(reliability(0,5)).toBeLessThan(.4);});
 it('unresolved misconceptions prevent mastery and can recover',()=>{const code='FRACTION_BIGGER_DENOMINATOR_BIGGER_VALUE';const m=updateMisconception(undefined,code,.8);expect(isMastered(baseline(.95),[m])).toBe(false);expect(nextAction(baseline(.95),[m])).toBe('correct');const resolved=updateMisconception(m,code,1,true);expect(resolved.resolvedAt).toBeTruthy();expect(isMastered(baseline(.95),[resolved])).toBe(true);});
 it('deduplicates positive evidence and stage submissions',()=>{let s={...freshSession(),run:freshRun('fraction-meaning')};s=addEvidence(s,'procedural',1,'build') as typeof s;const first=s.mastery.fractions.procedural;expect(addEvidence(s,'procedural',1,'build').mastery.fractions.procedural).toBe(first);const next=advance(s,0,15);expect(advance(next,0,15).xp).toBe(0);});
 it('does not award mastery after one novice lesson',()=>{let s=baseline();for(const d of dimensions)s=evidence(s,d,1);expect(isMastered(s)).toBe(false);});
 it('demo prior evidence plus four strong stages reaches gates',()=>{let s={...freshSession(true),run:freshRun('fraction-meaning')};for(const d of dimensions)s=addEvidence(s,d,1,'demo-stage') as typeof s;const done=finish(s);expect(isMastered(done.mastery.fractions)).toBe(true);expect(finish(done).xp).toBe(done.xp);});
 it('chooses an alternate representation after failed transfer',()=>expect(nextAction(baseline(.7),[],true)).toBe('alternate-representation'));
});
