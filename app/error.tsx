'use client';
import {Pip} from '@/components/pip/Pip';
export default function Error({reset}:{reset:()=>void}){return <main className="loading-pip"><Pip mood="confused"/><h1>A little tangle in the stars.</h1><p>Your saved discoveries are still on this device.</p><button className="button gold" onClick={reset}>Try again</button></main>}
