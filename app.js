let data = JSON.parse(localStorage.getItem("rc_data")) || {
  coches: [],
  clientes: [],
  ventas: [],
  retiros: [],
  depositos: [],
  historial: [],
  caja: { abierta:false, inicial:0 }
};

// 🔥 FIX DATOS (CRÍTICO)
if(!Array.isArray(data.coches)) data.coches = [];
if(!Array.isArray(data.clientes)) data.clientes = [];
if(!Array.isArray(data.ventas)) data.ventas = [];
if(!Array.isArray(data.retiros)) data.retiros = [];
if(!Array.isArray(data.depositos)) data.depositos = [];
if(!Array.isArray(data.historial)) data.historial = [];
if(!data.caja) data.caja = { abierta:false, inicial:0 };

let cocheSel = null;

// 🚗 CREAR COCHES BASE
if(data.coches.length === 0){
  data.coches = [
    "Drift 1","Drift 2",
    ...Array.from({length:10},(_,i)=>"Futbol "+(i+1)),
    ...Array.from({length:6},(_,i)=>"Robot "+(i+1))
  ].map(n=>({
    nombre:n,
    estado:"libre",
    tiempo:0,
    tiempoInicial:0,
    cliente:""
  }));
}

// 🥊 ASEGURAR LUCHADORES
for(let i=1;i<=10;i++){
  const nombre = "Luchador " + i;

  const existe = data.coches.some(c => c.nombre === nombre);

  if(!existe){
    data.coches.push({
      nombre: nombre,
      estado: "libre",
      tiempo: 0,
      tiempoInicial: 0,
      cliente: ""
    });
  }
}

function guardar(){
  localStorage.setItem("rc_data", JSON.stringify(data));
}

// 🔄 VISTAS
function cambiarVista(v){
  document.querySelectorAll(".vista").forEach(el=>{
    el.classList.remove("activo");
  });

  const actual = document.getElementById(v);
  if(actual) actual.classList.add("activo");

  if(v==="clientes") renderClientes();
  if(v==="historial") renderHistorial();
}

// 🎨 RENDER
function render(){
  const cont = document.getElementById("coches");
  if(!cont) return;

  cont.innerHTML="";

  const tipos = ["Drift","Futbol","Robot","Luchador"];

  tipos.forEach(tipo=>{
    const seccion = document.createElement("div");
    seccion.className="seccion";

    const titulo = document.createElement("h2");
    titulo.innerText = tipo;

    const grid = document.createElement("div");
    grid.className="grid";

    data.coches
      .filter(c=>c.nombre.toLowerCase().includes(tipo.toLowerCase()))
      .forEach((c)=>{
        const i = data.coches.findIndex(x=>x.nombre===c.nombre);

        let clase="libre";
        if(c.estado==="uso" && c.tiempo>5) clase="activo";
        if(c.tiempo<=5 && c.tiempo>0) clase="poco";
        if(c.tiempo<=0 && c.estado==="uso") clase="terminado";

        const div=document.createElement("div");
        div.className="coche "+clase;

        div.innerHTML=`
          <b>${c.nombre}</b><br>
          ${c.cliente || ""}<br>
          ${c.tiempo>0 ? c.tiempo+" min":""}<br>
          ${
            c.estado==="uso"
            ? `<button onclick="terminar(${i})">✔</button>
               <button onclick="cancelar(${i})">✖</button>`
            : `<button onclick="abrirModal(${i})">▶</button>`
          }
        `;

        grid.appendChild(div);
      });

    seccion.appendChild(titulo);
    seccion.appendChild(grid);
    cont.appendChild(seccion);
  });

  actualizarDinero();
}

// 🪟 MODAL
function abrirModal(i){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  cocheSel=i;
  document.getElementById("modal").classList.add("activo");
}

function cerrarModal(){
  document.getElementById("modal").classList.remove("activo");
}

// ▶ INICIAR
function confirmarInicio(){
  const nombre=document.getElementById("nombre").value;
  const tiempo=Number(document.getElementById("tiempo").value);

  if(!nombre || !tiempo) return;

  const c=data.coches[cocheSel];
  c.estado="uso";
  c.cliente=nombre;
  c.tiempo=tiempo;
  c.tiempoInicial=tiempo;

  data.clientes.push({
    nombre,
    coche:c.nombre,
    tiempo,
    hora:new Date().toLocaleTimeString()
  });

  cerrarModal();
  guardar();
  render();
}

// ✔ TERMINAR
function terminar(i){
  const c=data.coches[i];

  data.ventas.push({
    cliente:c.cliente,
    total: Math.ceil(c.tiempoInicial/15)*50
  });

  c.estado="libre";
  c.tiempo=0;
  c.cliente="";

  guardar();
  render();
}

// ❌ CANCELAR
function cancelar(i){
  const c=data.coches[i];
  c.estado="libre";
  c.tiempo=0;
  c.cliente="";
  guardar();
  render();
}

// ⏱ TIMER
setInterval(()=>{
  data.coches.forEach(c=>{
    if(c.estado==="uso"){
      c.tiempo--;
      if(c.tiempo<0) c.tiempo=0;
    }
  });
  guardar();
  render();
},60000);

// 💰 DINERO
function totalVentas(){
  return data.ventas.reduce((a,v)=>a+v.total,0);
}
function totalRetiros(){
  return data.retiros.reduce((a,r)=>a+r.monto,0);
}
function totalDepositos(){
  return data.depositos.reduce((a,d)=>a+d.monto,0);
}

function actualizarDinero(){
  const el = document.getElementById("dinero");
  if(!el) return;

  el.innerText =
    "💰 $" + (data.caja.inicial + totalVentas() + totalDepositos() - totalRetiros());
}

// 🏦 CAJA
function abrirCaja(){
  if(data.caja.abierta){
    alert("Ya abierta");
    return;
  }

  const monto=Number(prompt("Monto inicial"));
  if(!monto) return;

  data.caja={abierta:true,inicial:monto};
  guardar();
  render();
}

function cerrarCaja(){
  if(!data.caja.abierta) return;
  if(!confirm("¿Cerrar caja?")) return;

  const ventas = totalVentas();
  const retiros = totalRetiros();
  const depositos = totalDepositos();
  const final = data.caja.inicial + ventas + depositos - retiros;

  data.historial.push({
    fecha:new Date().toLocaleDateString(),
    hora:new Date().toLocaleTimeString(),
    inicial:data.caja.inicial,
    ventas,
    retiros,
    depositos,
    final,
    clientes: [...data.clientes]
  });

  data.ventas=[];
  data.retiros=[];
  data.depositos=[];
  data.clientes=[];
  data.caja={abierta:false,inicial:0};

  guardar();
  render();
  renderHistorial();
}

// 👥 CLIENTES
function renderClientes(){
  const cont=document.getElementById("listaClientes");
  if(!cont) return;

  cont.innerHTML="";

  data.clientes.forEach(c=>{
    const div=document.createElement("div");
    div.innerText=`${c.nombre} | ${c.coche} | ${c.tiempo}min | ${c.hora}`;
    cont.appendChild(div);
  });
}

// 📜 HISTORIAL
function renderHistorial(){
  const cont=document.getElementById("listaHistorial");
  if(!cont) return;

  cont.innerHTML="";

  data.historial.forEach(d=>{
    const div=document.createElement("div");
    div.className="card";

    div.innerHTML=`
      📅 ${d.fecha} - ${d.hora}<br>
      💰 Inicial: $${d.inicial}<br>
      🟢 Ventas: $${d.ventas}<br>
      🔵 Depósitos: $${d.depositos || 0}<br>
      🔴 Retiros: $${d.retiros}<br>
      🟡 Final: $${d.final}<br>
      👥 Clientes: ${(d.clientes || []).length}
    `;

    cont.appendChild(div);
  });
}

// 💸 RETIRO
function hacerRetiro(){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  const monto=Number(prompt("Monto"));
  if(!monto) return;

  data.retiros.push({monto});
  guardar();
  render();
}

// 💵 DEPÓSITO
function hacerDeposito(){
  if(!data.caja.abierta){
    alert("Abre caja primero");
    return;
  }

  const monto = Number(prompt("Monto"));
  if(!monto) return;

  const motivo = prompt("Motivo") || "Sin motivo";

  data.depositos.push({monto, motivo});
  guardar();
  render();
}

// 🚀 INIT
window.addEventListener("DOMContentLoaded", ()=>{
  render();
});

// 🔥 GLOBAL (SOLUCIONA ERRORES EN GITHUB)
window.cambiarVista = cambiarVista;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.confirmarInicio = confirmarInicio;
window.terminar = terminar;
window.cancelar = cancelar;
window.abrirCaja = abrirCaja;
window.cerrarCaja = cerrarCaja;
window.hacerRetiro = hacerRetiro;
window.hacerDeposito = hacerDeposito;

function borrarHistorial(){
  if(!confirm("¿Seguro que quieres borrar TODO el historial?")) return;

  data.historial = [];
  guardar();
  renderHistorial();
}
