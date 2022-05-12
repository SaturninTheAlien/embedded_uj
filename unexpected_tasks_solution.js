'use strict';

function oneOfEachProgrammableProcessorType(task_graph){
    let result = [];

    for(let i=0;i<task_graph.processors.length;++i){
        let p = task_graph.processors[i];
        if(!p.hardware_core){
            result.push({
                "processor": {
                    "name": p.name +"_0",
                    "type_id": i,
                    "hardware_core": false

                },
                "tasks": []
            })
        }
    }

    return result;
}

function assignUnexpectedTasks(task_graph, embedded_system){

    //let chosen_element = null;

    function f1(task){    
        let chosen_element = null;
        let chosen_time = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_time = task.times_per_processor[e.processor.type_id] * task.costs_per_processor[e.processor.type_id];
                if(new_time<chosen_time){

                    chosen_time = new_time;
                    chosen_element = e;
                }
            }
        }
        return chosen_element;
    }

    let ce = null;
    for(let task of task_graph.tasks){
        if(ce==null || Math.random() < 0.5){
            ce = f1(task);
        }
        if(ce!=null){
            ce.tasks.push(task.name);
        }
    }
}


function unexpectedTasksSolution(task_graph, c0, t0){
    let embedded_system = oneOfEachProgrammableProcessorType(task_graph);
    assignUnexpectedTasks(task_graph, embedded_system);

    let unexpected_cost = calculateCostOfExecution(embedded_system, task_graph);
    let unexpected_time = calculateTime(embedded_system, task_graph).total_time;

    let inner_html = `
    <p> C0 = ${c0} </p>
    <p> T0 = ${t0} </p>
    <br/>
    <p class="fd">Unexpected tasks assignment:</p>
    ${renderSystemDescription(embedded_system)}
    <br/>

    <p> Unexpected cost: ${unexpected_cost} </p>
    <p> Unexpected time: ${unexpected_time} </p>
    <p> New cost (C0 + Unexpected cost): ${unexpected_cost+c0} </p>
    <p> New time (T0 + Unexpected time): ${unexpected_time+t0} </p>
    `;

    return inner_html;
}