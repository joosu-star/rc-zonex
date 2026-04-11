let data = JSON.parse(localStorage.getItem("rc_data")) || {};

function init(){
  data.coches ||= [];
  data.clientes ||= [];
  data.ventas ||= [];
  data.retiros ||= [];
  data.depositos ||= [];
  data.historial ||= [];
  data.caja ||= { abierta:false, inicial:0 };
  data.precios ||= { normal:50, robot:40, luchador:40 };
}
init();

if(data.coches.length === 0){
  data.coches = [
    "Drift 1","Drift 2",
    ...Array.from({length:10},(_,i)=>"Futbol "+(i+1)),
    ...Array.from({length:6},(_,i)=>"Robot "+(i+1)),
    ...Array.from({length:10},(_,i)=>"Luchador "+(i+1))
  ].map(n=>({ nombre:n, estado:"libre", tiempo:0, tiempoInicial:0, cliente:"" }));
}

function guardar(){
  localStorage.setItem("rc_data", JSON.stringify(data));
}

function precio(nombre){
  nombre=nombre.toLowerCase();
  if(nombre.includes("robot")) return data.precios.robot;
  if(nombre.includes("luchador")) return data.precios.luchador;
  return data.precios.normal;
}

function estado(c){
  if(c.estado!=="uso") return "libre";
  if(c.tiempo<=0) return "terminado";
  if(c.tiempo<=5) return "poco";
  return "activo";
}

function render(){
  const cont=document.getElementById("coches");
  cont.innerHTML="";

  ["Drift","Futbol","Robot","Luchador"].forEach(tipo=>{
    const h=document.createElement("h2");
    h.innerText=tipo;

    const grid=document.createElement("div");
    grid.className="grid";

    data.coches.forEach((c,i)=>{
      if(!c.nombre.startsWith(tipo)) return;

      const div=document.createElement("div");
      div.className="coche "+estado(c);

      div.innerHTML=`
        <b>${c.nombre}</b><br>
        ${c.cliente||""}<br>
        ${c.tiempo>0?c.tiempo+" min":""}
      `;

      const btn=document.createElement("button");

      if(c.estado==="uso"){
        btn.innerText="✔";
        btn.onclick=()=>terminar(i);
      } else {
        btn.innerText="▶";
        btn.onclick=()=>abrirModal(i);
      }

      div.appendChild(document.createElement("br"));
      div.appendChild(btn);

      grid.appendChild(div);
    });

    cont.appendChild(h);
    cont.appendChild(grid);
  });

  actualizarDinero();
}

// MODAL
let seleccionado=null;

function abrirModal(i){
  if(!data.caja.abierta) return alert("Abre caja");
  seleccionado=i;
  document.getElementById("modal").classList.add("activo");
}

function cerrarModal(){
  document.getElementById("modal").classList.remove("activo");
}

// INICIAR
function confirmarInicio(imprimir=false){
  const nombre=document.getElementById("nombre").value;
  const tiempo=Number(document.getElementById("tiempo").value);

  if(!nombre || tiempo<=0) return alert("Datos inválidos");

  const c=data.coches[seleccionado];

  const inicio=new Date();
  const fin=new Date(inicio.getTime()+tiempo*60000);

  c.estado="uso";
  c.cliente=nombre;
  c.tiempo=tiempo;
  c.tiempoInicial=tiempo;

  data.clientes.push({
    nombre,
    coche:c.nombre,
    inicio:inicio.toLocaleTimeString(),
    tiempo
  });

  guardar();
  render();
  cerrarModal();

  if(imprimir){
    imprimirTicket({
      nombre,
      coche:c.nombre,
      inicio,
      fin,
      tiempo,
      costo: Math.ceil(tiempo/15)*precio(c.nombre)
    });
  }
}

// TICKET
function imprimirTicket(info){
  const area=document.getElementById("ticketArea");

  area.innerHTML=`
    <div id="ticket">
      <div class="center bold">RC-ZONE-18</div>
      <div class="center bold">LA DIVERSION AL MAXIMO</div>
      <hr>
      Cliente: ${info.nombre}<br>
      Coche: ${info.coche}<br>
      <hr>
      Inicio: ${info.inicio.toLocaleTimeString()}<br>
      Fin: ${info.fin.toLocaleTimeString()}<br>
      Tiempo: ${info.tiempo} min<br>
      <hr>
      TOTAL: $${info.costo}
      <hr>
      <div class="center">GRACIAS</div>
    </div>
  `;

  area.style.display="block";
  window.print();

  setTimeout(()=>area.style.display="none",500);
}

// EVENTOS
window.addEventListener("DOMContentLoaded",()=>{

  render();

  document.getElementById("btnIniciar").onclick=()=>confirmarInicio(false);
  document.getElementById("btnTicket").onclick=()=>confirmarInicio(true);
  document.getElementById("btnCancelarModal").onclick=cerrarModal;

  document.getElementById("btnAbrirCaja").onclick=abrirCaja;
  document.getElementById("btnCerrarCaja").onclick=cerrarCaja;
  document.getElementById("btnRetiro").onclick=hacerRetiro;
  document.getElementById("btnDeposito").onclick=hacerDeposito;
  document.getElementById("btnPrecios").onclick=editarPrecios;

  document.getElementById("btnInicioVista").onclick=()=>cambiarVista("inicio");
  document.getElementById("btnClientesVista").onclick=()=>cambiarVista("clientes");
  document.getElementById("btnHistorialVista").onclick=()=>cambiarVista("historial");
});
