'use strict';


function readTextFile(callback_on_success){
    let input = document.createElement('input');
    input.type = 'file';

    input.onchange = function(event){
        if(input.files.length==1){
            let file = input.files[0];
            let reader = new FileReader();

            reader.onload = function(event){
                let text = event.target.result;
                callback_on_success(text);
            }

            reader.readAsText(file);
        }
    }
    input.click();
}

function drawGantt(canvas, embedded_system, time_results){
    let ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.rect(50,20,w-70, h-40);
    ctx.stroke();

    const n = embedded_system.length;
    if(n==0)return;

    const dy = (h - 40) / n;
    ctx.font = "10px Arial";

    ctx.strokeStyle = "rgb(255,255,255)";

    let y = 50;
    for(let se of embedded_system){

        if(!se.processor.hardware_core){
            ctx.fillText(se.processor.name, 10, y);
            y+=dy;
        }
    }
}