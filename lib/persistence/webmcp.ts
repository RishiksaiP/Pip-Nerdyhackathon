import {z} from 'zod';
import type {Session} from './store';
import {buildReport} from '../mastery/report';
export function registerEvidenceTool(getSession:()=>Session){
 const modelContext=(document as Document&{modelContext?:{registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!modelContext?.registerTool)return ()=>{};
 const controller=new AbortController();
 try{void Promise.resolve(modelContext.registerTool({name:'read_pip_learning_evidence',title:'Read Pip learning evidence',description:'Read the current anonymous session’s learning evidence and deterministic tutor recommendation. Does not submit answers, change progress, or claim mastery.',inputSchema:{type:'object',properties:{world:{type:'string',enum:['fractions','multiplication','place-value']}},required:['world'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){const {world}=z.object({world:z.enum(['fractions','multiplication','place-value'])}).strict().parse(input);const session=getSession();return {demo:session.demo,...buildReport(session,world)};}},{signal:controller.signal})).catch(()=>{});}catch{}
 return ()=>controller.abort();
}
