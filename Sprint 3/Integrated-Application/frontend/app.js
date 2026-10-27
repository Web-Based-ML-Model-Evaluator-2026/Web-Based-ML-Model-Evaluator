const $ = (id) => document.getElementById(id);
let datasetText = "";
let filename = "customer_churn_sample.csv";
let lastResult = null;
const sample = `customer_id,age,monthly_spend,contract,region,churn
1001,24,45.5,Monthly,South,Yes
1002,37,78.2,Annual,West,No
1003,,61.0,Monthly,North,Yes
1004,46,,Annual,East,No
1005,29,52.4,Monthly,South,No
1006,51,99.9,Annual,West,No
1007,33,68.1,Monthly,North,Yes
1008,41,81.7,Annual,East,No
1009,27,49.0,Monthly,South,Yes
1010,56,105.2,Annual,West,No
1011,38,72.3,Monthly,North,No
1012,31,58.8,Annual,East,Yes
1013,44,89.5,Monthly,West,No
1014,22,39.9,Monthly,South,Yes
1015,48,94.0,Annual,North,No
1016,35,65.2,Monthly,East,Yes
1017,60,112.3,Annual,West,No
1018,28,47.7,Monthly,South,Yes
1019,39,76.4,Annual,North,No
1020,32,59.1,Monthly,East,No
`;
function toast(message, error=false){const t=$("toast");t.textContent=message;t.className=error?"show error":"show";setTimeout(()=>t.className="",3500)}
function csvHeaders(text){const first=text.trim().split(/\r?\n/,1)[0];return first.split(",").map(s=>s.trim().replace(/^"|"$/g,""))}
function setDataset(text,name){
 datasetText=text;filename=name;const lines=text.trim().split(/\r?\n/);const headers=csvHeaders(text);
 $("fileInfo").querySelector("b").textContent=name;
 $("fileInfo").querySelector("small").textContent=`${Math.max(0,lines.length-1)} data rows · ${headers.length} columns`;
 $("datasetSummary").innerHTML=`<b>${Math.max(0,lines.length-1)} rows · ${headers.length} columns</b><span>Ready for preprocessing</span>`;
 const select=$("target");select.innerHTML='<option value="">No target selected</option>';
 headers.forEach(h=>{const o=document.createElement("option");o.value=h;o.textContent=h;select.appendChild(o)});
 if(headers.includes("churn"))select.value="churn";
 $("results").hidden=true;toast(`Loaded ${name}`);
}
$("loadSample").addEventListener("click",()=>setDataset(sample,"customer_churn_sample.csv"));
$("csvFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;if(!f.name.toLowerCase().endsWith(".csv")){toast("Please select a .csv file.",true);e.target.value="";return}if(f.size>5*1024*1024){toast("File exceeds the 5 MB demo limit.",true);e.target.value="";return}setDataset(await f.text(),f.name)});
$("testSize").addEventListener("input",()=>{$("splitValue").textContent=$("testSize").value+"%"});
$("runBtn").addEventListener("click",async()=>{
 if(!datasetText){toast("Choose a CSV or click Use sample first.",true);return}
 const btn=$("runBtn");btn.disabled=true;btn.textContent="Processing dataset…";
 try{
  const response=await fetch("/api/preprocess",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv:datasetText,filename,missing:$("missing").value,encoding:$("encoding").value,scaling:$("scaling").value,target:$("target").value,test_size:Number($("testSize").value)})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||"Preprocessing failed");
  lastResult=result;renderResult(result);toast("Preprocessing completed successfully.");
 }catch(e){toast(e.message||"Unable to connect to the local backend.",true)}
 finally{btn.disabled=false;btn.innerHTML='Run preprocessing pipeline <span>→</span>'}
});
function renderResult(r){
 $("results").hidden=false;
 $("rowsMetric").textContent=`${r.rows_after}/${r.rows_before}`;$("rowsDetail").textContent="rows after / before";
 $("missingMetric").textContent=r.missing_handled;$("missingDetail").textContent=`${r.missing_after} missing cells remain`;
 $("splitMetric").textContent=`${r.train_rows} / ${r.test_rows}`;$("splitDetail").textContent=`${100-r.test_size}% train · ${r.test_size}% test`;
 $("featuresMetric").textContent=r.feature_columns.length;$("targetResult").textContent=r.target||"Not selected";
 $("resultMessage").textContent=`Processed ${r.filename} · ${r.output_columns.length} output columns`;
 $("previewTag").textContent=`${Math.min(20,r.preview.length)} of ${r.preview_rows} rows`;
 const table=$("previewTable");table.querySelector("thead").innerHTML="";table.querySelector("tbody").innerHTML="";
 const tr=document.createElement("tr");r.output_columns.forEach(h=>{const th=document.createElement("th");th.textContent=h;tr.appendChild(th)});table.querySelector("thead").appendChild(tr);
 r.preview.forEach(row=>{const tr=document.createElement("tr");r.output_columns.forEach(h=>{const td=document.createElement("td");const v=row[h];td.textContent=typeof v==="number"?(Number.isInteger(v)?v:Number(v.toFixed(5))):(v??"");tr.appendChild(td)});table.querySelector("tbody").appendChild(tr)});
 const items=[
 ["Missing-value strategy",r.missing_method],["Categorical encoding",r.encoding],["Numeric scaling",r.scaling],
 ["Target separation",r.target_separated?"Enabled":"No target selected"],["Training rows",r.train_rows],["Test rows",r.test_rows],
 ["Feature columns",r.feature_columns.join(", ")||"None"]];
 $("summaryList").innerHTML="";items.forEach(([k,v])=>{const row=document.createElement("div");row.className="summary-row";const a=document.createElement("span");a.textContent=k;const b=document.createElement("b");b.textContent=v;row.append(a,b);$("summaryList").appendChild(row)});
 $("results").scrollIntoView({behavior:"smooth",block:"start"});
}
$("downloadBtn").addEventListener("click",()=>{if(!lastResult)return;const blob=new Blob([lastResult.csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(filename.replace(/\.csv$/i,"")||"dataset")+"_preprocessed.csv";a.click();URL.revokeObjectURL(url);toast("Transformed CSV download started.")});
fetch("/api/health").then(r=>r.json()).then(d=>{if(d.status!=="ok")throw Error();}).catch(()=>toast("Backend health check failed. Restart the application.",true));
setDataset(sample,filename);
