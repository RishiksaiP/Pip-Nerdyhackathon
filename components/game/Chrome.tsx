'use client';
import Link from '@/components/game/AppLink';
import {Compass,Volume2,VolumeX,Home,FlaskConical} from 'lucide-react';
import {useSession} from './SessionProvider';
import {StarCore,JourneyFeedback} from './Progression';
export function Header({light=false,back=false}:{light?:boolean;back?:boolean}){const {session,update}=useSession();return <header className={`site-header app-header ${light?'light':''}`}><Link href={back?'/world':'/'} className="brand">{back?<Compass size={28}/>:<>pip<span>✦</span></>}</Link><nav aria-label="Main navigation"><Link href="/world"><Compass size={16}/> Explore</Link><Link href="/pip"><Home size={16}/> Pip’s room</Link><Link href="/grownups" className="grownup-nav">For grown-ups</Link></nav><div className="header-actions"><StarCore compact/><button className="icon-button" aria-label={session.sound?'Turn sound off':'Turn sound on'} onClick={()=>update(s=>({...s,sound:!s.sound}))}>{session.sound?<Volume2 size={19}/>:<VolumeX size={19}/>}</button></div><JourneyFeedback/></header>}
export function Footer(){return <footer className="app-footer"><span>TEACH IT. PROVE IT. MASTER IT.</span><Link href="/lab"><FlaskConical size={13}/> How Pip learns</Link><Link href="/demo">Guided demo ↗</Link></footer>}
