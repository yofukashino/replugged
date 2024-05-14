#!/usr/bin/env node
import Ge from"@electron/asar";import{copyFileSync as Ue,cpSync as je,existsSync as O,mkdirSync as ae,readFileSync as X,rmSync as le,writeFileSync as Ee}from"fs";import z from"esbuild";import d from"path";import Je from"update-notifier";import We from"yargs";import{hideBin as Ve}from"yargs/helpers";import W from"chalk";import Oe from"ws";import{existsSync as me,readFileSync as pe,writeFileSync as fe}from"fs";import I from"path";import k from"prompts";import C from"semver";import j from"chalk";import{execSync as ge}from"child_process";import{existsSync as _,readdirSync as Y}from"fs";import A from"path";import ue from"prompts";var h=_(A.join(process.cwd(),"plugins"))||_(A.join(process.cwd(),"themes"));function B(e){if(!_(A.join(u,e)))return[];let t=Y(A.join(u,e),{withFileTypes:!0});return t.filter(n=>n.isDirectory()),t.map(n=>n.name)}async function N(e){if(e!=="all"){let t=B(e),{addon:n}=await ue({type:"select",name:"addon",message:"Select an addon",choices:t.map(i=>({title:i,value:{type:e,name:i}}))},{onCancel:$});return n}else{let t=[],n=[];_(A.join(u,"plugins"))&&Y(A.join(u,"plugins"),{withFileTypes:!0}).forEach(o=>{o.isDirectory()&&t.push(o.name)}),_(A.join(u,"themes"))&&Y(A.join(u,"themes"),{withFileTypes:!0}).forEach(o=>{o.isDirectory()&&n.push(o.name)});let{addon:i}=await ue({type:"select",name:"addon",message:"Select an addon",choices:[...t.map(o=>({title:`${o} (plugin)`,value:{type:"plugins",name:o}})),...n.map(o=>({title:`${o} (theme)`,value:{type:"themes",name:o}}))]},{onCancel:$});return i}}async function L(e,t=!1){let{doContinue:n}=await k({type:"confirm",name:"doContinue",message:j.yellow(e),initial:t},{onCancel:$});n||(console.log(j.red("Aborting")),process.exit(0))}function v(e,t=!0){try{return ge(e,{encoding:"utf8",cwd:he()})}catch(n){if(!t)return n.stdout;console.error(n.message),process.exit(1)}}function $(){console.log(j.red("Aborting")),process.exit(128)}var G;function he(){if(G)return G;try{return G=ge("git rev-parse --show-toplevel",{encoding:"utf8",cwd:process.cwd()}).trim(),G}catch(e){e.message.includes("not a git repository")&&(console.log(j.red("You must run this command from within a git repository")),process.exit(1)),console.error(`Command failed with exit code ${e.status}: ${e.message}`),process.exit(1)}throw new Error("Unreachable")}async function ye(){let e=he();!v("git status --porcelain").trim()||await L("Working directory is not clean. Continue?");let i=h?await N("all"):null,o=i?I.resolve(e,i.type,i.name,"manifest.json"):I.resolve(e,"manifest.json");me(o)||(console.log(j.red("manifest.json not found")),process.exit(1));let p=pe(o,"utf8"),s;try{s=JSON.parse(p)}catch{console.log(j.red("manifest.json is not valid JSON")),process.exit(1)}let a=i?null:I.resolve(e,"package.json");!h&&!me(a)&&(console.log(j.red("package.json not found")),process.exit(1));let g=a?pe(a,"utf8"):null,c;try{c=a?JSON.parse(g):null}catch{console.log(j.red("package.json is not valid JSON")),process.exit(1)}let{version:f}=s,r,y=!!C.valid(f);if(y){let b=C.inc(f,"patch"),T=C.inc(f,"minor"),de=C.inc(f,"major");({nextVersion:r}=await k({type:"select",name:"nextVersion",message:"Version",choices:[{title:`Patch: v${b}`,value:b},{title:`Minor: v${T}`,value:T},{title:`Major: v${de}`,value:de},{title:"Custom",value:null}]},{onCancel:$}))}r||({nextVersion:r}=await k({type:"text",name:"nextVersion",message:y?"Custom Version":"Version",validate:b=>b.trim()?!0:"Version is required"},{onCancel:$})),r=r.trim();let P=!!C.valid(r);if(y)if(P){C.lte(r,f)&&await L(`Version ${r} is not greater than ${f}. Continue?`);let b=C.clean(r);if(b!==r){let{clean:T}=await k({type:"confirm",name:"clean",message:`Convert ${r} to cleaned version ${b}?`,initial:!0});T&&(r=b)}}else await L(`Version ${r} is not a valid semver. Continue?`);s.version=r,c&&(c.version=r),fe(o,`${JSON.stringify(s,null,2)}
`),c&&fe(a,`${JSON.stringify(c,null,2)}
`),v(h?`git add ${I.join(i.type,i.name,"manifest.json")}`:"git add manifest.json package.json");let{message:S}=await k({type:"text",name:"message",message:"Commit message",initial:h?`[${s.name}] Release v${r}`:`Release v${r}`,validate:b=>b.trim()?!0:"Commit message is required"},{onCancel:$}),x=v("git tag --list").split(`
`).filter(Boolean),{tagName:w}=await k({type:"text",name:"tagName",message:"Tag name",initial:h?`v${r}-${s.name.replace(" ","_")}`:`v${r}`,validate:b=>b.trim()?x.includes(b)?`Tag ${b} already exists`:!0:"Tag name is required"},{onCancel:$}),m=!!v("git config --get user.signingkey",!1).trim(),D=v("git config --get commit.gpgsign",!1).trim()==="true",_e=v("git config --get tag.gpgsign",!1).trim()==="true",K=!1;m&&(!D||!_e)&&({sign:K}=await k({type:"confirm",name:"sign",message:"Sign commit and tag?",initial:!0})),v(`git commit${K?" -S":""} -m "${S}"`),v(`git tag${K?" -s":""} -a -m "${S}" "${w}"`),await L("Push changes to remote?",!0),v("git push"),v("git push --tags")}import{execSync as Re}from"child_process";import{chownSync as ee,existsSync as J,mkdirSync as be,statSync as Fe,writeFileSync as Te}from"fs";import Q,{join as E}from"path";import R from"chalk";var U="replugged",Be=()=>{let e=process.env.SUDO_USER||process.env.DOAS_USER,t=process.env.HOME;switch(process.platform){case"win32":return E(process.env.APPDATA||"",U);case"darwin":return E(t||"","Library","Application Support",U);default:if(process.env.XDG_CONFIG_HOME)return E(process.env.XDG_CONFIG_HOME,U);if(e)try{let n=Re(`getent passwd ${e}`,{stdio:[null,null,"ignore"]}).toString("utf-8").split(":")[5];n&&J(n)?t=n:(console.error(new Error(`Passwd entry for "${e}" contains an invalid home directory.`)),process.exit(1))}catch(n){console.error("Could not find passwd entry of sudo/doas user",n),process.exit(1)}return E(t||"",".config",U)}},M=Be();J(M)||be(M,{recursive:!0});var we=["plugins","themes","settings","quickcss","react-devtools"],Ie=Object.fromEntries(we.map(e=>{let t=E(M,e);return J(t)||be(t),[e,t]})),{uid:te,gid:ne}=Fe(E(M,"..")),Se=process.platform==="linux";Se&&(ee(M,te,ne),we.forEach(e=>ee(E(M,e),te,ne)));var Z=E(Ie.quickcss,"main.css");J(Z)||(Te(Z,""),Se&&ee(Z,te,ne));var Le=e=>{if(e===0)return"0b";let t=1024,n=1,i=["b","kb","mb","gb"],o=Math.floor(Math.log(e)/Math.log(t));return`${parseFloat((e/Math.pow(t,o)).toFixed(n))}${i[o]}`},oe={name:"logBuild",setup:e=>{let t;e.onStart(()=>{t=Date.now()}),e.onEnd(n=>{var g;let i=Date.now()-t,o=((g=n.metafile)==null?void 0:g.outputs)||{},p=Object.entries(o).sort(([c],[f])=>{let r=c.endsWith(".map"),y=f.endsWith(".map");return r&&!y?1:!r&&y?-1:0}).map(([c,{bytes:f}])=>{let{sep:r}=Q,y=Q.dirname(c),P=Q.basename(c),S=[y,r,R.bold(P)].join(""),x=Le(f),w=f>Math.pow(1024,2)&&!c.endsWith(".map"),m=w?R.yellow(x):R.cyan(x),D=w?R.yellow(" \u26A0\uFE0F"):"";return{name:S,size:m,suffix:D}}),s=Math.max(...p.map(({name:c})=>c.length)),a=Math.max(...p.map(({size:c})=>c.length));console.log(""),p.forEach(({name:c,size:f,suffix:r})=>{console.log(`  ${c.padEnd(s+1)} ${f.padStart(a)}${r}`)}),console.log(""),console.log(`\u26A1 ${R.green(`Done in ${i.toLocaleString()}ms`)}`)})}};import{sassPlugin as He}from"esbuild-sass-plugin";import{fileURLToPath as qe,pathToFileURL as ze}from"url";var u=process.cwd(),Xe=d.dirname(qe(import.meta.url)),Ke=JSON.parse(X(d.resolve(Xe,"package.json"),"utf-8")),ve=d.join(u,"esbuild.extra.mjs"),De=new Promise(e=>{O(ve)&&e(import(ze(ve).href).then(t=>t.default)),e(t=>t)}),Ye=`Update available ${W.dim("{currentVersion}")}${W.reset(" \u2192 ")}${W.green("{latestVersion}")} 
Run ${W.cyan("pnpm i -D replugged")} to update`,Qe=Je({pkg:Ke,shouldNotifyInNpmScript:!0});function Pe(){Qe.notify({message:Ye})}var Ze=6463,et=6472;function Ne(){return Math.random().toString(16).slice(2)}var l,xe=!1,F;function tt(e){return l=new Oe(`ws://127.0.0.1:${e}/?v=1&client_id=REPLUGGED-${Ne()}`),new Promise((t,n)=>{let i=!1;l==null||l.on("message",o=>{i||JSON.parse(o.toString()).evt!=="READY"||(i=!0,t(l))}),l==null||l.on("error",()=>{i||(i=!0,n(new Error("WebSocket error")))}),l==null||l.on("close",()=>{l=void 0,!i&&(i=!0,n(new Error("WebSocket closed")))})})}async function nt(){if(l&&l.readyState===Oe.OPEN)return l;if(xe)return null;if(F)return await F;F=(async()=>{for(let t=Ze;t<=et;t++)try{return l=await tt(t),l}catch{}})();let e=await F;if(F=void 0,e)return e;console.error("Could not connect to Discord websocket"),xe=!0}var se=!1,ie=!1;async function ce(e){let t=await nt();if(!t)return;if(se){ie=!0;return}let n=Ne();t.send(JSON.stringify({cmd:"REPLUGGED_ADDON_WATCHER",args:{id:e},nonce:n})),se=!0,await new Promise(i=>{let o=async p=>{let s=JSON.parse(p.toString());if(s.nonce===n){if(t.off("message",o),se=!1,ie){ie=!1,i(await ce(e));return}if(s.data.success)console.log("Reloaded addon"),i(void 0);else{let a=s.data.error,g="Unknown error";switch(a){case"ADDON_NOT_FOUND":g="Addon not found";break;case"ADDON_DISABLED":g="Addon disabled";break;case"RELOAD_FAILED":g="Reload failed";break}console.error(`Failed to reload addon: ${g}`),i(void 0)}}};t.on("message",o)})}function Ae(e,t){B(t).forEach(i=>re(e,i,t))}async function re(e,t,n){let i=t?d.join(u,n,t,"manifest.json"):d.join(u,"manifest.json"),o=JSON.parse(X(i,"utf-8")),p=t?`dist/${o.id}`:"dist";O(p)&&le(p,{recursive:!0}),await e({watch:!1,noInstall:!0,production:!0,addon:t});let s=`bundle/${o.id}`;O("bundle")||ae("bundle"),Ge.createPackage(p,`${s}.asar`),Ue(`${p}/manifest.json`,`${s}.json`),console.log(`Bundled ${o.name}`)}async function Ce(e,t){await Promise.all(e.map(async n=>{t?await n.watch():(await n.rebuild().catch(()=>{}),n.dispose())}))}var V="replugged",ke=(()=>{switch(process.platform){case"win32":return d.join(process.env.APPDATA||"",V);case"darwin":return d.join(process.env.HOME||"","Library","Application Support",V);default:return process.env.XDG_CONFIG_HOME?d.join(process.env.XDG_CONFIG_HOME,V):d.join(process.env.HOME||"",".config",V)}})(),Me="91";function $e(e,t,n){B(n).forEach(o=>{e({...t,addon:o})})}async function H({watch:e,noInstall:t,production:n,noReload:i,addon:o}){let p=o?d.join(u,"plugins",o,"manifest.json"):d.join(u,"manifest.json"),s=JSON.parse(X(p.toString(),"utf-8")),a=o?`dist/${s.id}`:"dist",g=o?d.join(u,"plugins",o):u,r=[{name:"globalModules",setup:w=>{w.onResolve({filter:/^replugged(\/\w+)?$/},m=>{if(m.kind==="import-statement")return m.path.includes("dist")?{errors:[{text:`Unsupported import from dist: ${m.path}
Import from either the top level of this module ("replugged") or a top-level subpath (e.g. "replugged/common") instead.`}]}:{path:m.path,namespace:"replugged"}}),w.onResolve({filter:/^react$/},m=>{if(m.kind==="import-statement")return{path:"replugged/common/React",namespace:"replugged"}}),w.onLoad({filter:/.*/,namespace:"replugged"},m=>({contents:`module.exports = window.${m.path.replaceAll("/",".")}`}))}},{name:"install",setup:w=>{w.onEnd(async()=>{if(!t){let m=d.join(ke,"plugins",s.id);O(m)&&le(m,{recursive:!0,force:!0}),je(a,m,{recursive:!0}),console.log("Installed updated version"),i||await ce(s.id)}})}}];e&&r.push(oe);let y={absWorkingDir:u,bundle:!0,format:"esm",logLevel:"info",minify:n,platform:"browser",plugins:r,sourcemap:!n,target:`chrome${Me}`},P=[],S=await De;"renderer"in s&&(P.push(z.context(S({...y,entryPoints:[d.join(g,s.renderer)],outfile:`${a}/renderer.js`}))),s.renderer="renderer.js"),"plaintextPatches"in s&&(P.push(z.context(S({...y,entryPoints:[d.join(g,s.plaintextPatches)],outfile:`${a}/plaintextPatches.js`}))),s.plaintextPatches="plaintextPatches.js"),O(a)||ae(a,{recursive:!0}),Ee(`${a}/manifest.json`,JSON.stringify(s));let x=await Promise.all(P);await Ce(x,e),l==null||l.close()}async function q({watch:e,noInstall:t,production:n,noReload:i,addon:o}){let p=o?d.join(u,"themes",o,"manifest.json"):"manifest.json",s=JSON.parse(X(p.toString(),"utf-8")),a=o?`dist/${s.id}`:"dist",g=o?d.join(u,"themes",o):u,c=d.join(g,s.main||"src/main.css"),f=O(d.join(g,s.splash||"src/main.css"))?d.join(g,s.splash||"src/main.css"):void 0,r={name:"install",setup:m=>{m.onEnd(async()=>{if(!t){let D=d.join(ke,"themes",s.id);O(D)&&le(D,{recursive:!0,force:!0}),je(a,D,{recursive:!0}),console.log("Installed updated version"),i||await ce(s.id)}})}},y=[He(),r];e&&y.push(oe);let P={absWorkingDir:u,bundle:!0,format:"esm",logLevel:"info",minify:n,platform:"browser",plugins:y,sourcemap:!n,target:`chrome${Me}`},S=[],x=await De;c&&(S.push(z.context(x({...P,entryPoints:[c],outfile:`${a}/main.css`}))),s.main="main.css"),f&&(S.push(z.context(x({...P,entryPoints:[f],outfile:`${a}/splash.css`}))),s.plaintextPatches="splash.css"),O(a)||ae(a,{recursive:!0}),Ee(`${a}/manifest.json`,JSON.stringify(s));let w=await Promise.all(S);await Ce(w,e),l==null||l.close()}var{argv:Bt}=We(Ve(process.argv)).scriptName("replugged").usage("$0 <cmd> [args]").command("build <addon>","Build an Addon",e=>{e.positional("addon",{type:"string",describe:"Either a plugin or theme"}),e.option("no-install",{type:"boolean",describe:"Don't install the built addon",default:!1}),e.option("watch",{type:"boolean",describe:"Watch the addon for changes to reload building",default:!1}),e.option("production",{type:"boolean",describe:"Don't compile the source maps when building.",default:!1}),e.option("no-reload",{type:"boolean",describe:"Don't reload the addon in Discord after building.",default:!1}),e.option("all",{type:"boolean",describe:"Build all addons in a monorepo.",default:!1})},async e=>{if(e.addon==="plugin"){if(e.all&&h)return $e(H,e,"plugins");{let t=h?await N("plugins"):void 0;H({...e,addon:t==null?void 0:t.name})}}else if(e.addon==="theme"){if(e.all&&h)return $e(q,e,"themes");{let t=h?await N("themes"):void 0;q({...e,addon:t==null?void 0:t.name})}}else console.log("Invalid addon type.");Pe()}).command("bundle <addon>","Bundle any Addon",e=>{e.positional("addon",{type:"string",describe:"Either a plugin or theme"})},async e=>{if(e.addon==="plugin"){if(e.all&&h)return Ae(H,"plugins");{let t=h?await N("plugins"):void 0;re(H,t==null?void 0:t.name,"plugins")}}else if(e.addon==="theme"){if(e.all&&h)return Ae(q,"themes");{let t=h?await N("themes"):void 0;re(q,t==null?void 0:t.name,"themes")}}else console.log("Invalid addon type.");Pe()}).command("release","Interactively release a new version of an addon",()=>{},ye).parserConfiguration({"boolean-negation":!1}).help();export{u as directory};