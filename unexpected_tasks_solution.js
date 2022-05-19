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

function assignUnexpectedTasks(task_graph, embedded_system, selected_mode=0){

    //let chosen_element = null;

    let calculateCost = null;
    switch(selected_mode){
        /**
         * Minimal cost 
         * */
        case 0:{
            
            calculateCost = function(task, proc_type_id){
                return task.costs_per_processor[proc_type_id];
            }
        }
        break;
        /**
         * Minimal time 
         * */
        case 1:{
            calculateCost = function(task, proc_type_id){
                return task.times_per_processor[proc_type_id];
            }
        }
        break;
        /** 
         * Minimal time*cost 
         * */
        case 2:{
            calculateCost = function(task, proc_type_id){
                return task.costs_per_processor[proc_type_id] * task.times_per_processor[proc_type_id];
            }
        }
        break;
    }

    function f2(task){    
        let chosen_element = null;
        let chosen_cost = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_cost =  calculateCost(task, e.processor.type_id);
                if(new_cost<chosen_cost){

                    chosen_cost = new_cost;
                    chosen_element = e;
                }
            }
        }
        return chosen_element;
    }

    let ce = null;
    for(let task of task_graph.tasks){
        ce = f2(task);
        ce.tasks.push(task.name);
    }
}


function unexpectedTasksSolution(task_graph, c0, t0, selected_mode){
    let embedded_system = oneOfEachProgrammableProcessorType(task_graph);
    assignUnexpectedTasks(task_graph, embedded_system, selected_mode);

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

if(typeof window === 'undefined'){
    module.exports = {
        oneOfEachProgrammableProcessorType,
        assignUnexpectedTasks,
        unexpectedTasksSolution
    }   
}
