'use strict';

function calculateCostGains(task_graph, embedded_system){

    let results = [];

    let programmable_processors = embedded_system.
        map(a=>a.processor).
        filter(a=>!a.hardware_core);

    let hasProgrammableProcessors = programmable_processors.length>0;


    for(let task of task_graph.tasks){
        let currentProc = findProcInSystemByTaskName(embedded_system, task.name);
        if(currentProc!=null){
            let currentProcIndex = currentProc.type_id;
            let currentCost = task.costs_per_processor[currentProcIndex];

            //let tmp = [];
            for(let i=0;i<task_graph.processors.length;++i){
                if(i==currentProcIndex)continue;

                let newCost = task.costs_per_processor[i];

                if(hasProgrammableProcessors){
                    let proc1 = programmable_processors.find(p=>p.type_id==i);
                    if(proc1==null){
                        newCost += task_graph.processors[i].cost;
                    }
                }

                results.push({
                    "task_name": task.name,
                    "current_proc": currentProc,
                    //"new_proc": task_graph.processors[i].name,
                    "new_proc_type_index": i,
                    "cost_gain": currentCost - newCost
                })
            }
        }
    }

    return results;
}


function replaceProcessor(task_graph, embedded_system, task_name, old_processor, new_proc_type_id){

    if(old_processor.type_id==new_proc_type_id)return embedded_system;

    let t1 = embedded_system.find(a=>a.processor.name == old_processor.name);
    if(t1==null){
        throw "Not such processor in this system";
    }

    let t1_tasks = t1.tasks.filter(a => a!=task_name);
    let new_system = embedded_system.filter(a=> !Object.is(a, t1));

    if(t1_tasks.length>0){
        new_system.push({
            "processor": old_processor,
            "tasks": t1_tasks,
        });
    }

    let t2 = embedded_system.find(a=>a.processor.type_id == new_proc_type_id);

    if(t2==null){
        let proc_type = task_graph.processors[new_proc_type_id];
        new_system.push({
            "processor": {
                "hardware_core": proc_type.hardware_core,
                "type_id": new_proc_type_id,
                "name": `${proc_type.name}_0`
            },
            "tasks": [task_name, ]
        })
    }
    else{
        new_system = new_system.filter(a=> !Object.is(a, t2));
        new_system.push({
            "processor": t2.processor,
            "tasks": t2.tasks.concat([task_name, ]),
        });
    }

    return new_system;
}


function modifySystemByCostGains(task_graph, embedded_system, min_cost_gain=50){

    let result = embedded_system;

    while(true){


        let cost_gains = calculateCostGains(task_graph, result);
        if(cost_gains.length==0)return result;

        let tmp = cost_gains.reduce((a,b)=>a.cost_gain>=b.cost_gain ? a: b);

        if(tmp.cost_gain>=min_cost_gain){
            result = replaceProcessor(task_graph, result, tmp.task_name, tmp.current_proc, tmp.new_proc_type_index);
        }
        else{
            return result;
        }
    }
}

if(typeof window === 'undefined'){
    
    module.exports = {

        calculateCostGains,
        replaceProcessor,
        modifySystemByCostGains,
    }
}