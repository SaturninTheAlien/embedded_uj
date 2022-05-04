'use strict'


/**
 * 1. New (not allocated) the fastest
 * 2. New (not allocated) the cheapest
 * 3. Used the fastest
 * 4. Used the cheapest
 * 5. Used min (time*cost)
 * 6. New min (time*cost)
 * 7. Idle for the longest time
 * 8. The rarest used
 * 9. The same as predecessor
 */

class SpanningTreeNode{
    constructor(task_index, construction_option=0){
        this.task_index = task_index;
        this.construction_option = construction_option;
        this.children = [];
    }
    // bracket notation
    toString(){
        let result = `${this.task_index}<${this.construction_option}>`
        //let result = this.task_name;
        if(this.children.length>0){
            result+="(" + this.children.map(a=>a.toString()).join(",") + ")";
        }

        return result;
    }
}


function createSpanningTree(task_graph, choose_construction_option){
    if(task_graph.tasks.length==0)return null;

    
    function f1(parent_node, task){
        for(let s of task.successors){

            let s_id = s.id;
            let s_task = task_graph.tasks[s_id];

            let child_node = new SpanningTreeNode(s_id, choose_construction_option(s_task));

            f1(child_node, s_task);

            parent_node.children.push(child_node);
        }
    }

    let root_task = task_graph.tasks[0];
    let root = new SpanningTreeNode(0, choose_construction_option(root_task));

    f1(root, root_task);

    return root;
}

function createRandomSpanningTree(task_graph){
    return createSpanningTree(task_graph, function(){
        return Math.floor(Math.random() * 9) + 1;
    })
}


function createEmbeddedSystemFromSpanningTree(task_graph, spanning_tree){

    let embedded_system = [];

    function new_the_fastest(task){
        let chosen_index = 0;
        let chosen_time = task.times_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_time = task.times_per_processor[i];
            if(new_time < chosen_time){

                chosen_time = new_time;
                chosen_index = i;
            }    
        }

        let chosen_proc_type = task_graph.processors[chosen_index];

        let proc_counter = embedded_system.filter(a => a.processor.type_id == chosen_index).length;
        embedded_system.push({
            "tasks": [task.name, ],
            "processor": {
                "hardware_core": chosen_proc_type.hardware_core,
                "type_id": chosen_index,
                "name": processor_type.name+"_"+proc_counter
            }
        });
    }

    function new_the_cheapest(task){
        let chosen_index = 0;
        let chosen_cost = task.costs_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_cost = task.costs_per_processor[i];

            if(new_cost < chosen_cost){

                chosen_cost = new_cost;
                chosen_index = i;
            }    
        }

        let chosen_proc_type = task_graph.processors[chosen_index];
        let proc_counter = embedded_system.filter(a => a.processor.type_id == chosen_index).length;
        embedded_system.push({
            "tasks": [task.name, ],
            "processor": {
                "hardware_core": chosen_proc_type.hardware_core,
                "type_id": chosen_index,
                "name": processor_type.name+"_"+proc_counter
            }
        });
    }

    function new_best_tcm(task){
        let chosen_index = 0;
        let chosen_tcm = task.costs_per_processor[0] * task.times_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_tcm = task.costs_per_processor[i];

            if(new_tcm < chosen_tcm){

                chosen_tcm = new_tcm;
                chosen_index = i;
            }    
        }

        let chosen_proc_type = task_graph.processors[chosen_index];
        let proc_counter = embedded_system.filter(a => a.processor.type_id == chosen_index).length;
        embedded_system.push({
            "tasks": [task.name, ],
            "processor": {
                "hardware_core": chosen_proc_type.hardware_core,
                "type_id": chosen_index,
                "name": processor_type.name+"_"+proc_counter
            }
        });
    }

    function used_the_fastest(task){
        
        let chosen_element = null;
        let chosen_time = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.hardware_core){
                let new_time = task.times_per_processor[e.processor.type_id];
                if(new_time<chosen_time){

                    chosen_time = new_time;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            new_the_fastest(task);
        }
        else{
            e.tasks.push(task.name);
        }
    }

    function used_the_cheapest(task){
        let chosen_element = null;
        let chosen_cost = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.hardware_core){
                let new_cost = task.costs_per_processor[e.processor.type_id];

                if(new_cost<chosen_cost){

                    chosen_cost = new_cost;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            new_the_fastest(task);
        }
        else{
            e.tasks.push(task.name);
        }
    }

    function used_best_tcm(task){
        let chosen_element = null;
        let chosen_tcm = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.hardware_core){
                let new_tcm = task.costs_per_processor[e.processor.type_id]*
                task.times_per_processor[e.processor.type_id];

                if(new_tcm<chosen_tcm){

                    chosen_tcm = new_tcm;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            new_the_fastest(task);
        }
        else{
            e.tasks.push(task.name);
        }
    }

    function the_rarest_used(task){
        let chosen_element = null;
        let tmp = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.hardware_core){
                let new_tmp = e.tasks.length;
                if(new_tmp<tmp){

                    tmp = new_tmp;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            new_best_tcm(task);
        }
        else{
            e.tasks.push(task.name);
        }
    }

    function mCalculateTime(task_name, proc_type_id){
        let task = task_graph.tasks.find(t => t.name==task_name);
        if(task==null){
            throw `Task with the name ${task_name} not found`;
        }
        return task.times_per_processor[proc_type_id];
    }

    function idle_the_longest_time(task){
        let chosen_element = null;
        let tmp = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.hardware_core){
                let new_tmp = e.tasks.
                map(t_name => mCalculateTime(t_name, e.processor.type_id)).
                reduce((a,b)=>a+b);

                if(new_tmp<tmp){

                    tmp = new_tmp;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            new_best_tcm(task);
        }
        else{
            e.tasks.push(task.name);
        }
    }
    
    return embedded_system;
}


if(typeof window === 'undefined'){
    
    module.exports = {
        createSpanningTree,
        createRandomSpanningTree,
        createEmbeddedSystemFromSpanningTree
    }
}