export type Fraction={n:number;d:number};
export type Comparison='left'|'right'|'equal';
export function validFraction(f:Fraction):boolean{return Number.isSafeInteger(f.n)&&Number.isSafeInteger(f.d)&&f.n>=0&&f.d>0&&f.n<=10000&&f.d<=10000;}
export function compareFractions(a:Fraction,b:Fraction):Comparison{if(!validFraction(a)||!validFraction(b))throw new Error('Invalid fraction');const l=a.n*b.d,r=b.n*a.d;return l===r?'equal':l>r?'left':'right';}
export function equivalent(a:Fraction,b:Fraction){return compareFractions(a,b)==='equal';}
export function validateBuild(selected:number,total:number,target:Fraction){return Number.isInteger(selected)&&selected>=0&&selected<=total&&validFraction({n:selected,d:total})&&equivalent({n:selected,d:total},target);}
export function multiply(rows:number,columns:number){if(!Number.isInteger(rows)||!Number.isInteger(columns)||rows<0||columns<0||rows>100||columns>100)throw new Error('Invalid array');return rows*columns;}
export function compose(hundreds:number,tens:number,ones:number){if(![hundreds,tens,ones].every(n=>Number.isInteger(n)&&n>=0&&n<=9))throw new Error('Invalid place value');return hundreds*100+tens*10+ones;}
export function decompose(n:number){if(!Number.isInteger(n)||n<0||n>999)throw new Error('Invalid number');return {hundreds:Math.floor(n/100),tens:Math.floor(n/10)%10,ones:n%10};}
export function comparisonKernel(left:Fraction,right:Fraction){return Object.freeze({skill:'compare_fractions',left:Object.freeze({...left}),right:Object.freeze({...right}),answer:compareFractions(left,right),canonicalConcept:'Compare values using equal-sized wholes. More equal parts make each part smaller.'});}
