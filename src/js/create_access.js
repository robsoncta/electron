const {ipcRenderer} = require('electron')
var serverApi, server, user, pass, accessToken, serverStatus, serverApiStatus, login, loggedApiUser;

// serverApi = 'http://niot-env.eba-nj9qdzma.sa-east-1.elasticbeanstalk.com/';
serverApi = 'https://desk.niot.com.br/';
// serverApi = 'http://api.niot.test/';
// server = 'https://localhost:30443/';
// user = 'niot';
// pass = 'niot';

serverStatus = false;
serverApiStatus = false;
formApiLogin = false;
login = false;
loginApi = false;

appToken = Math.random().toString(16).slice(2);

cond_id = '';
app_id = '';

condominio = false;
formUnidades = false;

ipcRenderer.send('get-preferences', {} )
ipcRenderer.on('index-preferences-reply', (event, arg) => {
    
    if(arg !== undefined){
        //serverApi = arg.cloudAddress;
        server = arg.serverAddress;
        user = arg.serverUser;
        pass = arg.serverPass;
        if(arg.app_id !== undefined){
            app_id = arg.app_id;
        }else{
            app_id = appToken;
            let data = {server, user, pass, app_id};
            ipcRenderer.send('store-preferences', data )
        }
        
    }else{
        server = 'https://localhost:30443/';
        user = 'niot';
        pass = 'niot';
        app_id = appToken;
    }

   //$('#exampleFormControlInput0').val(serverApi);
    $('#exampleFormControlInput1').val(server);
    $('#exampleFormControlInput2').val(user);
    $('#exampleFormControlInput3').val(pass);
})


window.onload = function() {

    setTimeout(
    function() 
    {

        start();
        
    }, 1000);

    // receive message from main.js
    


    $( ".toSubmit" ).submit(function( event ) {

        event.preventDefault();
    
        let serverAddress = document.getElementById("exampleFormControlInput1").value;
        let serverUser = document.getElementById("exampleFormControlInput2").value;
        let serverPass = document.getElementById("exampleFormControlInput3").value;
    
        let data = {serverAddress, serverUser, serverPass, app_id};
    
        // send username to main.js
        
        ipcRenderer.send('store-preferences', data )


        serverStatus = false;
        // serverApiStatus = false;
        login = false;

        alert('Atualizado');

    });

    $( ".toApiLogin" ).submit(function( event ) {

        event.preventDefault();
    
        let username = document.getElementById("username").value;
        let pass = document.getElementById("password").value;
    
        
        toLoginApi(username, pass);
        

    });

    $( ".toCondSelect" ).submit(function( event ) {

        event.preventDefault();
    
        condominio = document.getElementById("unidadeSelect").value;

        formUnidades = false;
        if(formUnidades == false){
            $('.form-api-unidades').addClass('d-none');
        }
        monitor();
    });
};

function socketData(){
    $.ajax({
        type: "GET",
        url: serverApi + '/desktop-connection?cond_id='+condominio+'&app_id='+app_id,
    }).done(function(res) {
        //
    })
    .fail(function() {
       // 
    })
    .always(function() {
       // 
    });
}

function pingApi(){

    $('#CS').html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>');

    $.ajax({
        type: "GET",
        url: serverApi,
    }).done(function(res) {
        serverApiStatus = true;
        $('#CS').html('OK');

        formApiLogin = true;

        if(formApiLogin == true){
            $('.form-api-login').removeClass('d-none');
        }
    })
    .fail(function() {
        serverApiStatus = false;
        $('#CS').html('Fail');
    })
    .always(function() {
        //
    });

}

function pingServer(){

    $('#SS').html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>');

    $.ajax({
        type: "GET",
        url: server,
    }).done(function(res) {
        serverStatus = true;
        $('#SS').html('OK');
    })
    .fail(function() {
        serverStatus = false;
        $('#SS').html('Fail');
    })
    .always(function() {
        //
    });

}

function toLogin(){

    var data = '{"username":"'+user+'","password":"'+pass+'"}';

    $.ajax({
        type: "POST",
        url: server + 'api/login',
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
    }).done(function(res) {

        accessToken = res.accessToken;
        login = true;

    })
    .fail(function(res) {
        console.log(res);
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function toLoginApi(user, pass){

    var data = '{"email":"'+user+'","pass":"'+pass+'"}';

    $.ajax({
        type: "POST",
        url: serverApi + 'api/usuario/login',
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
    }).done(function(res) {

        if(res.usuario == null){
            alert('Usuário ou senha inválida!');
        }else{

            loggedApiUser = res.usuario;
            loginApi = true;

            formApiLogin = false;
            if(formApiLogin == false){
                $('.form-api-login').addClass('d-none');
            }

            formUnidades = true;
            if(formUnidades == true){
                $('.form-api-unidades').removeClass('d-none');
            }
            
            loggedApiUser.CondominioUnidades.forEach(element => {
                //console.log(element.Condominio, element.Nome);
                $('#unidadeSelect').append('<option value="'+element.Condominio.$oid+'">'+element.Nome+'</option>');
            });
        }

    })
    .fail(function(err) {
        console.log(err);
        //alert( "erro durante login na API" );
    })
    .always(function() {
        //
    });
}

function start(){

    setInterval(function(){

        

        if(serverApiStatus != true){
            pingApi();
        }

        if(serverStatus != true){
            pingServer();
        }



        if(serverApiStatus == true && serverStatus == true){
            if(condominio != false){
                socketData();
            }
            if(login == true && loginApi == true){
                if(condominio != false){
                    getAcessos();
                    delAcessos();
                }
            }else{
                
                toLogin();
            }
        }

    }, 5000);



}

function delAcessos(){

    let data = {'condId':condominio};

    $.ajax({
        type: "GET",
        url: serverApi + 'api/acessos/get-del-access',
        contentType:"application/json; charset=utf-8",
        data: data,
        dataType:"json",
    }).done(function(res) {
        res.forEach(element => {
            
            //===============================================================
            //Delete User -> DELETE => https://localhost:30443/api/user/1000033
            $.ajax({
                type: "DELETE",
                url: server + 'api/user/' + element.Id,
                contentType:"application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType:"json",
            }).done(function(res) {
                //
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //
            });
            //===============================================================

            //===============================================================
            //Delete Rule -> DELETE => https://localhost:30443/api/rule/2
            $.ajax({
                type: "DELETE",
                url: server + 'api/rule/' + element.ruleId,
                contentType:"application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType:"json",
            }).done(function(res) {
                //
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //
            });
            //===============================================================

            //===============================================================
            //Delete Time -> DELETE => https://localhost:30443/api/schedule/2
            $.ajax({
                type: "DELETE",
                url: server + 'api/schedule/' + element.timeId,
                contentType:"application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType:"json",
            }).done(function(res) {
                //
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //
            });
            //===============================================================

            //===============================================================
            //===============================================================
            //===============================================================

            $.ajax({
                type: "POST",
                url: serverApi + 'api/acessos/complete-delete/' + element._id,
                contentType:"application/json; charset=utf-8",
                dataType:"json",
            }).done(function(res) {
                console.log('done');
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //
            });
            //===============================================================
            //===============================================================
            //===============================================================
            
        });
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function getAcessos(){

    let data = {'condId':condominio};

    $.ajax({
        type: "GET",
        url: serverApi + 'api/acessos',
        contentType:"application/json; charset=utf-8",
        data: data,
        dataType:"json",
    }).done(function(res) {
        res.forEach(element => {
            
            //Cadastra horario
            var schedule = {
                'name' : 'Niot-' + element._id,
            };

            var timeStart, timeEnd;
            //PERIODOS
            if(element.PeriodoAcesso == 'DiaTodo'){
                timeStart = "0";
                timeEnd = "86340";
            }
            if(element.PeriodoAcesso == 'manha'){
                timeStart = "25200";
                timeEnd = "43140";
            }
            if(element.PeriodoAcesso == 'tarde'){
                timeStart = "43200";
                timeEnd = "64740";
            }
            if(element.PeriodoAcesso == 'noite'){
                timeStart = "64800";
                timeEnd = "86340";
            }
            if(element.PeriodoAcesso == 'madrugada'){
                timeStart = "0";
                timeEnd = "25140";
            }   
            if(element.PeriodoAcesso == 'comercial'){
                timeStart = "32400";
                timeEnd = "64800";
            }

            //WEEKDAYS

            if(element.Weekdays.includes('seg')){
                schedule['mondayStart'] = timeStart;
                schedule['mondayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('ter')){
                schedule['tuesdayStart'] = timeStart;
                schedule['tuesdayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('qua')){
                schedule['wednesdayStart'] = timeStart;
                schedule['wednesdayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('qui')){
                schedule['thursdayStart'] = timeStart;
                schedule['thursdayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('sex')){
                schedule['fridayStart'] = timeStart;
                schedule['fridayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('sab')){
                schedule['saturdayStart'] = timeStart;
                schedule['saturdayEnd'] = timeEnd;
            }
            if(element.Weekdays.includes('dom')){
                schedule['sundayStart'] = timeStart;
                schedule['sundayEnd'] = timeEnd;
            }

            var scheduleRegistred = createSchedule(schedule, element);

            

            

            //Send DeviceId to association
            
        });
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function updateCode(originElement, userRegistred, scheduleRegistred, assoc, qrcode){

    var data = {'element' : originElement, 'user' : userRegistred, 'schedule' : scheduleRegistred, 'assoc' : assoc, 'qrcode' : qrcode};

    data = JSON.stringify(data);

    $.ajax({
        type: "POST",
        url: serverApi + 'api/acessos/complete',
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
    }).done(function(res) {
        console.log('done');
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function assoc(scheduleRegistred, userRegistred, originElement, qrcode){

    var data = {
        "name" : "Niot-" + originElement._id,
        "ReEntryLockEnabled":0,
        "EscortEnabled":0,
        "IsBiometryDisabled":false,
        "IsCardDisabled":false,
        "IsPasswordDisabled":false,
        "ManualAuthorizationOption":0,
        "RandomInspectPercent":0.1,
        "EscortPeriod":8,
        "users":[
            userRegistred.newID
        ],
        "areas":[
            1
        ],
        "schedules":[
            scheduleRegistred.newID
        ],
        "devices":[
            
        ],
        "creditTypes":[
            
        ],
        "selectedEscorted":[
            
        ],
        "selectedEscortUsers":[
            
        ],
        "idType":1
    };

    console.log(data);
    data = JSON.stringify(data);


    $.ajax({
        type: "POST",
        url: server + 'api/rule',
        data: data,
        contentType:"application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType:"json",
    }).done(function(res) {
        //return res;

        var assoc = res;

        updateCode(originElement, userRegistred, scheduleRegistred, assoc, qrcode);

        //alert('done');
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function createSchedule(schedule, originElement){
    var data = JSON.stringify(schedule);
    $.ajax({
        type: "POST",
        url: server + 'api/schedule',
        data: data,
        contentType:"application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType:"json",
    }).done(function(res) {

        var schedule = res

        //Cadastra usuário
        createUser('Niot-' + originElement._id, originElement.CodAcesso, schedule, originElement);

        //return res;
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });
}

function createUser(newUser, newPass, schedule, originElement){

    $.ajax({
        type: "POST",
        url: server + 'api/qrcode/userqrcode',
        contentType:"application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType:"json",
    }).done(function(res) {

        let qrCodeId = res;

        console.log(qrCodeId);

        var data = '{"credits":[],"inativo":false,"blackList":false,"contingency":false,"cards":[{"type":2,"number":'+qrCodeId+',"idType":1}],"groups":[1],"groupsList":[{"contingency":false,"disableADE":false,"id":1,"id2":null,"idType":0,"maxTimeInside":null,"nPeople":0,"nUsers":0,"nVisitors":0,"name":"Departamento Padrão","qtyTotalSpots":0,"users":null,"usersList":null}],"shelfStartLifeDate":"","shelfLifeDate":"","customFields":{},"name":"'+newUser+'","password":"'+newPass+'","password_confirmation":"'+newPass+'","pis":0,"shelfLife":null,"shelfStartLife":null,"foto":null,"fotoDoc":null}';

        $.ajax({
            type: "POST",
            url: server + 'api/user',
            data: data,
            contentType:"application/json; charset=utf-8;",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            dataType:"json",
        }).done(function(res) {

            let userRegistred = res;
            let dataQrCode = qrCodeId;

            $.ajax({
                type: "POST",
                url: server + 'api/qrcode/getqrcode',
                data: dataQrCode,
                contentType:"application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType:"json",
            }).done(function(res2) {

                let qrcode = res2;
                console.log('Tamanho QRCode: ' + qrcode.length);
    
                var assocRegistred = assoc(schedule, userRegistred, originElement, qrcode);
    
                //return res;
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //
            });

            //return res;
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //
        });
    })
    .fail(function() {
        //alert( "error" );
    })
    .always(function() {
        //
    });

    

}


function getData() { 
    
    return $.ajax({
        // url: server + "api/access/monitor?areas=&events=&limite=15&mode=loop&modevalue=&parkings=&time=",
        url: server + "api/access/monitor?areas=&events=&limite=15&mode=logs&modevalue=&parkings=",
        type: 'GET',
        contentType:"application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType:"json",
    });

    return data
};

async function monitor() {
	let response = await getData(); //Monitor URL
    
	// if (response.status == 502) {
	// 	// Status 502 is a connection timeout error,
	// 	// may happen when the connection was pending for too long,
	// 	// and the remote server or a proxy closed it
	// 	// let's reconnect
	// 	await monitor();
	// } else if (response.status != 200) {
	// 	// An error - let's show it
	// 	console.log(response.data);

	// 	// Reconnect in ten seconds
	// 	await new Promise(resolve => setTimeout(resolve, 10000));

	// 	await monitor();
	// } else {
		// Get and show the message
		monitorInteraction(response);

		// Call monitor() again to get the next message
        setTimeout(() => { 
            monitor();
        }, 15000);
		
	// }
}

function monitorInteraction(response){

    console.log(response);

    if(response.data.length > 0){

        let allNotifications = [];

        response.data.forEach(element => {

            let device = element.idDevice;
            let userId = element.idUser;
            let eventCode = element.eventCode;
            let time = element.time;

            let user;

            //Identificar user NIOT
            user = $.ajax({
                type: "GET",
                url: server + 'api/user/' + userId,
                contentType:"application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType:"json",
                async: false
            });

            let userInfo = user.responseJSON;

            if(userInfo.name.startsWith("Niot-")){

                userNiotId = userInfo.name.split("-");
                userNiotId = userNiotId[1];

                let theData = {
                    userId : userNiotId,
                    deviceId: device,
                    eventCode: eventCode,
                    time: time
                };

                allNotifications.push(theData);

            }

            
            
        });

        $.ajax({
            type: "POST",
            url: serverApi + 'api/notifications/',
            data: JSON.stringify(allNotifications),
            dataType:"json",
            contentType:"application/json; charset=utf-8;",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
        }).done(function(res) {
            // console.log('done');
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //
        });
    }
        
 
}