'use strict';

function taskGraphToString(task_graph)
{
    let result = `@tasks ${task_graph.tasks.length}\n`;
    for(let task of task_graph.tasks)
    {
        result+=task.name+" "+task.successors.length;
        for(let successor of task.successors)
        {
            result+=` ${successor.id}(${successor.data})`;
        }
        result+="\n";
    }
    result+= `@proc ${task_graph.processors.length}\n`;
    for(let proc of task_graph.processors)
    {
        result+= `${proc.cost} ${proc.data} ${proc.hardware_core ? 0 : 1}\n`;
    }
    result+= "@times\n";
    for(let task of task_graph.tasks)
    {
        for(let t of task.times_per_processor)
        {
            result += `${t} `;
        }
        result += "\n";
    }

    result+= "@cost\n";
    for(let task of task_graph.tasks)
    {
        for(let cost of task.costs_per_processor)
        {
            result += `${cost} `;
        }
        result+="\n";
    }

    result+=`@comm ${task_graph.channels.length}\n`;
    for(let channel of task_graph.channels)
    {
        result+=`${channel.name} ${channel.cost} ${channel.data}`;
        for(let b of channel.suitable_for_processors)
        {
            result+=` ${b?1:0}`;
        }
        result+="\n";
    }
    return result;
}


function readTaskGraph(source)
{
    let task_number=0;
    let successors_number=0;

    let counter1 = 0;
    let counter2 = 0;

    let lines = source.split("\n");

    let tasks = [];
    let processors = [];
    let channels = [];

    let task = null;
    let proc = null;
    let channel = null;

    let state = 0;
    //let flag1 = true;

    let pp_counter=1;
    let hc_counter=1;

    function mParseNonNegativeInteger(source, name)
    {
        let result = parseInt(source);
        if(isNaN(result) || result < 0)
        throw `Parsing error: ${name} must be a non-negative integer`;

        return result;
    }

    function mParseBoolean(source, name)
    {
        if(source == "0" || source == "false")return false;
        else if(source == "1" || source == "true")return true;
        else throw `Parsing error: ${name} must be a boolean`;
    }


    for(let line of lines)
    {
        let words = line.split(" ");
        let i = 0;
        let s1 = null;

        while(i<words.length)
        {
            s1 = words[i];
            i+=1;
            

            //flag1 = true;

            if(s1.length==0)continue;
            if(s1[0]=="#")break;

            switch(state)
            {
            case 0:
            {
                //console.log(s1);

                if(s1=="@tasks")
                {
                    //console.log("TASKS");
                    state = 1;
                }
                else if(s1=="@proc")
                {
                    //console.log("PROC");
                    state = 5;
                }
                else if(s1=="@times")
                {
                    //console.log("TIMES");
                    state = 9;
    
                    counter1=0;
                    counter2=0;
                }
                else if(s1=="@cost")
                {
                    //console.log("COST");

                    state = 10;
    
                    counter1=0;
                    counter2=0;
                }
                else if(s1=="@comm")
                {
                    //console.log("CHANNELS");
                    state = 11;
                }   
            }
            break;
            case 1:
            {
                task_number = mParseNonNegativeInteger(s1, "Task number");
                state = 2;
                counter1 = task_number;
            }
            break;
            case 2:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    continue;
                }

                task = {
                    "name":s1,
                    "successors":[],
                    "costs_per_processor":[],
                    "times_per_processor":[]
                }

                tasks.push(task);

                state = 3;
            }
            break;
            case 3:
            {
                successors_number = mParseNonNegativeInteger(s1, "Successors number");                
                counter2 = successors_number;
                state = 4;
            }
            break;
            case 4:
            {
                if(counter2 -- <=0 )
                {
                    state=2;
                    i-=1;
                    continue;
                }
                
                let tmp = s1.replace(")", " ").replace("(", " ").split(" ");
                if(tmp.length<2)
                {
                    //console.log(tmp);
                    throw "Parsing error: "+s1;
                }

                let successor = {
                    "id": parseInt(tmp[0]),
                    "data": parseInt(tmp[1])
                }

                if(isNaN(successor.id) || successor.id<0)
                throw "Successor id must be a non-negative integer";

                if(isNaN(successor.data) || successor.data<0)
                throw "Successor data must be a non-negative integer";

                task.successors.push(successor);
            }
            break;
            case 5:
            {
                let processors_number = mParseNonNegativeInteger(s1, "Processors number");
                counter1 = processors_number;
                state = 6;
            }
            break;
            //proc

            case 6:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    //console.log("YYYYYY" + s1);
                    continue;
                }
                let p_cost = mParseNonNegativeInteger(s1, "Processor cost");
                proc = {
                    "cost":p_cost,
                    "data":null,
                    "hardware_core":null,
                    "name":null
                };
                processors.push(proc);
                state = 7;
            }
            break;
            case 7:
            {
                proc.data = mParseNonNegativeInteger(s1, "Proc data");
                state = 8;
            }
            break;
            case 8:
            {
                let programmable_processor = mParseBoolean(s1, "PP");
                proc.hardware_core = !programmable_processor;

                if(programmable_processor){
                    proc.name = "PP"+pp_counter.toString();
                    ++pp_counter;
                }
                else{
                    proc.name = "HC"+hc_counter.toString();
                    ++hc_counter;
                }
                state = 6;
            }
            break;

            //TIMES
            case 9:
            {
                let execution_time = mParseNonNegativeInteger(s1, "Execution time");
                tasks[counter1].times_per_processor.push(execution_time);
                if(++counter2 >= processors.length)
                {
                    counter2=0;
                    if(++counter1 >= tasks.length)
                    {
                        state=0;
                        i-=1;
                        continue;
                    }
                }

            }
            break;
            //COSTS
            case 10:
            {
                let execution_cost = mParseNonNegativeInteger(s1, "Execution cost");
                tasks[counter1].costs_per_processor.push(execution_cost);
                if(++counter2 >= processors.length)
                {
                    counter2=0;
                    if(++counter1 >= tasks.length)
                    {
                        state=0;
                        i-=1;
                        continue;
                    }
                }
            }
            break;
            //CHANNELS
            case 11:
            {
                let channels_number = mParseNonNegativeInteger(s1, "Channels number");
                counter1 = channels_number;
                state = 12;
            }
            break;

            case 12:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    continue;
                }

                channel = {
                    "name": s1,
                    "cost": null,
                    "suitable_for_processors":[]
                }
                channels.push(channel);

                state = 13;
            }
            break;
            case 13:
            {
                channel.cost = mParseNonNegativeInteger(s1, "Channel cost");
                state = 14;
            }
            break;
            case 14:
            {
                channel.data = mParseNonNegativeInteger(s1, "Channel data transfer");
                state = 15;
                counter2 = 0;
            }
            break;
            case 15:
            {
                if(counter2++>=processors.length)
                {
                    state=12;
                    continue;
                }

                let suitable_for_processor = mParseBoolean(s1, "suitable_for_processor");
                channel.suitable_for_processors.push(suitable_for_processor);
            }
            break;
            default:
                break;
            }
        }
    }

    let result = {
        "tasks": tasks,
        "processors": processors,
        "channels": channels
    }

    result.toString = function()
    {
        return taskGraphToString(this);
    }

    return result;
}

function findTheFastestSolution(task_graph){

    function findFastestProcessorTypeIndex(task){

        let chosen_index = 0;
        let chosen_time = task.times_per_processor[0];
        let chosen_cost = task.costs_per_processor[0];

        for(let i=1;i<task.times_per_processor.length;++i){
            let time2 = task.times_per_processor[i];
            let cost2 = task.costs_per_processor[i];

            if(time2<chosen_time || (time2==chosen_time && cost2<chosen_cost)){
                chosen_index = i;
                chosen_time = time2;
                chosen_cost = cost2;
            }
        }
        return chosen_index;
    }

    let embedded_system = [];

    let tmp = [];
    let pp_counter = 0;
    for(let task of task_graph.tasks){
        let chosen_proccessor_index = findFastestProcessorTypeIndex(task);

        let processor_type = task_graph.processors[chosen_proccessor_index];
        if(processor_type.hardware_core){
            let s = embedded_system.find(s=>s.processor.type_id == chosen_proccessor_index);
            if(s!=null){
                s.tasks.push(task.name);
            }
            else{
                embedded_system.push({
                    "tasks": [task.name],
                    "processor":{
                        "hardware_core": true,
                        "type_id": chosen_proccessor_index,
                        "name": processor_type.name
                    }
                })
            }
        }
        else{
            embedded_system.push({
                "tasks": [task.name],
                "processor": {
                    "hardware_core": false,
                    "type_id": chosen_proccessor_index,
                    "name": processor_type.name+"_"+pp_counter.toString()
                }
            })
            ++pp_counter;
        }
    }

    return embedded_system;
}


function findTheCheapestSolution(task_graph){

    let tmp = [];
    for(let i=0;i<task_graph.processors.length;++i){
        
        let proc = task_graph.processors[i];
        if(proc.hardware_core)continue;
        let total_cost = proc.cost +
        task_graph.tasks.map(t=>t.costs_per_processor[i]).reduce((a,b)=>a+b);

        tmp.push({
            "proc": proc,
            "totol_cost": total_cost,
            "proc_id": i
        });
    }

    tmp = tmp.reduce((a,b)=>a.totol_cost>b.totol_cost?b:a);
    return [{
        "processor":{
            "hardware_core":false,
            "name": tmp.proc.name + "_0",
            "type_id": tmp.proc_id,
        },
        "tasks": task_graph.tasks.map(t=>t.name),
    }]
}

function findProcInSystemByTaskName(embedded_system, task_name){
    for(let e of embedded_system){
        if(e.tasks.find(o=>o==task_name)!=null){
            return e.processor;
        }
    }
    return null;
}

function calculateTime(embedded_system, task_graph){
    let detailed_results = [];

    let channel = task_graph.channels.find(function(channel){
        for(let b of channel.suitable_for_processors){
            if(!b)return false;
        }
        return true;
    });

    if(channel==null){
        throw "Systems without default channel not supported yet";
    }

    function f1(programmable_proc_name, start_time){
        let tmp = detailed_results.filter(dr => dr.proc_name==programmable_proc_name);
        if(tmp.length==0)return start_time;

        let last_task_end_time = tmp.map(t=>t.end_time).reduce((a,b)=>a>b?a:b);
        return last_task_end_time > start_time ? last_task_end_time : start_time;
    }

    function f2(task_name, start_time){
        let task = task_graph.tasks.find(t=>t.name==task_name);

        let proc = findProcInSystemByTaskName(embedded_system, task_name);
        if(proc==null){
            return;
        }

        if(!proc.hardware_core){
            start_time = f1(proc.name, start_time);
        }

        let proc_type_id = proc.type_id;
        let end_time = start_time + task.times_per_processor[proc_type_id];


        detailed_results.push({
            "task_name":task_name,
            "start_time":start_time,
            "end_time":end_time,
            "proc_name":proc.name
        })

        for(let successor of task.successors){
            let successor_name = task_graph.tasks[successor.id].name;
            if(detailed_results.find(t=>t.task_name==successor_name)==null){
                let data_transfer_time = 0;
                if(successor.data!=0){
                    data_transfer_time = Math.ceil(successor.data / channel.data);
                }
                f2(successor_name, end_time + data_transfer_time);
            }
        }
    }

    let t0 = task_graph.tasks[0];
    f2(t0.name, 0);

    let total_time = detailed_results.map(o=>o.end_time).reduce(
        (prev, current) => prev > current ? prev : current
    );
    
    return {
        "detailed_results":detailed_results,
        "total_time":total_time
    };
}


function calculateCostOfExecution(embedded_system, task_graph){
    let cost_of_execution = 0;
    for(let e of embedded_system){
        let proc_type_id = e.processor.type_id;

        for(let t_name of e.tasks){
            let task = task_graph.tasks.find(t=>t.name == t_name);
            cost_of_execution+=task.costs_per_processor[proc_type_id];
        }
    }

    return cost_of_execution;
}


function calculateCost(embedded_system, task_graph){

    let total_number_of_processors = 0;

    let cost_of_processors = 0;
    let cost_of_channels = 0;
    let cost_of_execution = 0;

    for(let e of embedded_system){

        let proc_type_id = e.processor.type_id;

        if(e.processor.hardware_core){
            total_number_of_processors += e.tasks.length;
        }
        else{
            ++total_number_of_processors;
            cost_of_processors += task_graph.processors[proc_type_id].cost;
        }

        for(let t_name of e.tasks){
            let task = task_graph.tasks.find(t=>t.name == t_name);
            cost_of_execution+=task.costs_per_processor[proc_type_id];
        }
    }

    let channel = task_graph.channels.find(function(channel){
        for(let b of channel.suitable_for_processors){
            if(!b)return false;
        }
        return true;
    });

    if(channel==null){
        throw "Systems without default channel not supported yet";
    }

    cost_of_channels = channel.cost * total_number_of_processors;

    return {
        "cost_of_processors":cost_of_processors,
        "cost_of_channels":cost_of_channels,
        "cost_of_execution":cost_of_execution,
        "total_cost":cost_of_channels+cost_of_processors+cost_of_execution
    }
}


function renderSystemDescription(system_in){
    let inner_html = "";
    for(let e of system_in){
        inner_html += `<p> ${e.processor.name}: ${e.tasks.join(",")} </p>`;
    }
    return inner_html;
}

function renderSystemStatistics(task_graph, system_in, show_detailed_time_results=true){

    let cost_results = calculateCost(system_in, task_graph);
    let time_results = calculateTime(system_in, task_graph);

    let inner_html =  `
    <br/>
    <p>Cost of programmable processors: ${cost_results.cost_of_processors}</p>
    <p>Cost of execution: ${cost_results.cost_of_execution}</p>
    <p>Cost of channels: ${cost_results.cost_of_channels}</p>
    <p>Total cost: ${cost_results.total_cost}</p>
    <p>Total time: ${time_results.total_time} </p>
    <br/>
    `;

    if(show_detailed_time_results){
        for(let dr of time_results.detailed_results){
            inner_html += `<p>${dr.task_name}: ${dr.start_time} _ ${dr.end_time} # ${dr.proc_name}</p>`
        }
    }

    return inner_html;
}


function renderSystemDescriptionWithStatistics(task_graph, system_in, show_detailed_time_results=true){
    let inner_html = renderSystemDescription(system_in);
    inner_html += renderSystemStatistics(task_graph, system_in, show_detailed_time_results);

    return inner_html;
}


if(typeof window === 'undefined'){
    
    module.exports = {
        taskGraphToString,
        readTaskGraph,
        findTheFastestSolution,
        findTheCheapestSolution,
        calculateCostOfExecution,
        calculateCost,
        calculateTime,
        renderSystemDescription,
        renderSystemStatistics,
        renderSystemDescriptionWithStatistics
    }
}