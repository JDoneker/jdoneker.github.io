
//Sends an XMLHttp request to the file "PSCompPars_2023.02.02_22.22.21.csv" stored
//in the same folder as this script
const xhr = new XMLHttpRequest();
xhr.open('GET', 'PSCompPars_2023.02.02_22.22.21.csv', false); 
//Data from the NASA Exoplanet Archive,
//Retrived 2/2/2023
//This research has made use of the NASA Exoplanet Archive, which is operated by the 
//California Institute of Technology, under contract with the 
//National Aeronautics and Space Administration under the Exoplanet Exploration Program.
xhr.send();
//.csv file received in plain text and defines the "exoplanetObjects" list
let exoplanetObjects = arrayFromCSV(xhr.responseText);
//function to turn the plain text csv into an array/list of custom Exoplanet Objects
function arrayFromCSV(csvRaw) {
        let temp = [];
        let columns = csvRaw.split("\n")[0].split(",");
        let rows = csvRaw.split("\n").splice(1);
        rows.splice(rows.length-1,1);
        for(var i = 0; i<rows.length; i++){
                temp.push(new Exoplanet(columns, rows[i].split(",")));
        }
        return temp;
}
//Constructor function for the Exoplanet Object
//parameters: all the column defintions and the values for the exoplanet we are constructing
function Exoplanet(columnDefinitions,columnValues){
        for(var i = 0; i<columnDefinitions.length; i++){
                this[columnDefinitions[i]] = columnValues[i];
        }
}

//the user triggers this function when they press the Random Exoplanet button on the webpage
function randomExoplanet(){
        //this code gets the number from the input box and tests to see if it is valid
        let dist = parseInt(document.getElementById("distNum").value);
        dist = dist*0.306601;
        if(dist < 1.3 || isNaN(dist)){
                console.log("invalid");
                return
        }
        //finds a exoplanet that has a distance less than the maximum value the user selected
        var exoplanetObject = exoplanetObjects[Math.floor(Math.random()*exoplanetObjects.length)];
        while(parseFloat(exoplanetObject.sy_dist)>dist||isNaN(parseFloat(exoplanetObject.sy_dist))){
                exoplanetObject = exoplanetObjects[Math.floor(Math.random()*exoplanetObjects.length)];
        }
        //appends a variable amount of divs to the DOM 
        //the amount of divs appended is number the exoplanets that are in the randomly selected system
        const outputsDiv = document.getElementById("outputsDiv");
        outputsDiv.innerHTML = "";
        for (var i=0;i<findNeighbors(exoplanetObject).length; i++){
                let newDiv = generateDiv(findNeighbors(exoplanetObject)[i],i);
                outputsDiv.appendChild(newDiv);
        }
}
//generates a div element that contains information about the exoplanet parameter
//parameters: an exoplanet object, and the index of that planet in its system
//returns: a div filled with data about the exoplanet
function generateDiv(exoplanet,index){
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(document.createTextNode("Planet Name: "+exoplanet.pl_name));
        tempDiv.appendChild(document.createElement("br"));
        tempDiv.appendChild(document.createTextNode(exoplanet.pl_name+
        " was discovered in "+exoplanet.disc_year+
        " at "+exoplanet.disc_facility+
        " using the "+exoplanet.discoverymethod+" method"));
        tempDiv.appendChild(document.createElement("br"));
        tempDiv.appendChild(document.createTextNode("The radius of "+exoplanet.pl_name+
        " is "+exoplanet.pl_rade+" times the radius of the Earth"));
        tempDiv.appendChild(document.createElement("br"));
        tempDiv.appendChild(document.createTextNode(exoplanet.pl_name+" is "+
        (Math.round(
        ((parseFloat(exoplanet.sy_dist)*3.26156) + Number.EPSILON) * 100
        )/ 100).toString()+" light years away from our solar system."));
        tempDiv.setAttribute("class", "outputDiv");
        tempDiv.setAttribute("id", "planet"+index+"Div");
        return tempDiv
}
//function to find all the exoplanets that are in the same exosolar system as the one in the parameter
//parameters: exoplanet object of the exoplanet we are trying to find the neighbors of
//returns: a list of exoplanet objects that are in the same exosolar system as the one in the parameter
//does this by looping through the list containing all the exoplanets and testing to see if they
//are in the same exosolar system
function findNeighbors(exoplanet){
        let temp = [];
        for(var i=0;i<exoplanetObjects.length; i++){
                if(exoplanetObjects[i].hostname==exoplanet.hostname){
                        temp.push(exoplanetObjects[i]);
                }
        }
        return temp;
}
