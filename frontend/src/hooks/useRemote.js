import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
export async function jsonRequest(path, method='GET', body) {
 const options={method};if(body!==undefined){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body);}
 const response=await apiFetch(path,options);const data=await response.json();if(!response.ok)throw new Error(data.mensaje||'No se pudo completar la operación.');return data;
}
export function useRemote(path) {
 const [state,setState]=useState({data:null,error:'',loaded:''});const [version,setVersion]=useState(0);
 const key=`${path}:${version}`;
 useEffect(()=>{let active=true;jsonRequest(path).then(data=>{if(active)setState({data,error:'',loaded:key});}).catch(error=>{if(active)setState({data:null,error:error.message,loaded:key});});return()=>{active=false;};},[path,key]);
 const refresh=useCallback(()=>setVersion(v=>v+1),[]);
 return {...state,loading:state.loaded!==key,refresh};
}
