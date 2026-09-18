import Link from '@/components/game/AppLink';
import {Pip} from '@/components/pip/Pip';
export default function NotFound(){return <main className="loading-pip"><Pip mood="curious"/><h1>This part of the universe is still a mystery.</h1><Link className="button gold" href="/world">Back to the worlds</Link></main>}
