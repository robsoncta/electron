const { ipcRenderer } = require('electron');
var serverApi, server, user, pass, accessToken, serverStatus, serverApiStatus, login, loggedApiUser;

serverApi = 'https://desk.niot.com.br/';
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

ipcRenderer.send('get-preferences', {});
ipcRenderer.on('index-preferences-reply', (event, arg) => {
    if (arg !== undefined) {
        server = arg.serverAddress;
        user = arg.serverUser;
        pass = arg.serverPass;
        app_id = arg.app_id !== undefined ? arg.app_id : appToken;
        if (!arg.app_id) {
            let data = { server, user, pass, app_id };
            ipcRenderer.send('store-preferences', data);
        }
    } else {
        server = 'https://localhost:30443/';
        user = 'niot';
        pass = 'niot';
        app_id = appToken;
    }

    $('#exampleFormControlInput1').val(server);
    $('#exampleFormControlInput2').val(user);
    $('#exampleFormControlInput3').val(pass);
});

window.onload = function () {
    setTimeout(async function () {
        await authenticate();
        start();
    }, 1000);

    $(".toSubmit").submit(function (event) {
        event.preventDefault();

        let serverAddress = document.getElementById("exampleFormControlInput1").value;
        let serverUser = document.getElementById("exampleFormControlInput2").value;
        let serverPass = document.getElementById("exampleFormControlInput3").value;

        let data = { serverAddress, serverUser, serverPass, app_id };
        ipcRenderer.send('store-preferences', data);

        serverStatus = false;
        login = false;

        alert('Configurações atualizadas');

    });

    $(".toApiLogin").submit(function (event) {
        event.preventDefault();

        let username = document.getElementById("username").value;
        let pass = document.getElementById("password").value;

        alert('Iniciando processo de login na API');
        toLoginApi(username, pass);
    });

    $(".toCondSelect").submit(function (event) {
        event.preventDefault();

        condominio = document.getElementById("unidadeSelect").value;
        formUnidades = false;
        if (!formUnidades) {
            $('.form-api-unidades').addClass('d-none');
        }
        monitor();
    });
};

async function authenticate() {
    alert('Iniciando autenticação');
    try {
        let response = await $.ajax({
            type: "POST",
            url: serverApi + 'api/login',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({
                email: "robson.costa@niot.com.br",
                senha: "Niot123"
            }),
        });
        accessToken = response.accessToken;
        alert('Autenticado com sucesso, token obtido: ' + accessToken);
    } catch (err) {
        console.error('Erro na autenticação: ', err);
        alert('Erro de autenticação. Verifique suas credenciais.');
    }
}

function socketData() {
    alert('Enviando dados via socket');
    $.ajax({
        type: "GET",
        url: serverApi + '/desktop-connection?cond_id=' + condominio + '&app_id=' + app_id,
    }).done(function () {
        alert('Dados do socket enviados com sucesso');
    }).fail(function () {
        alert('Falha ao enviar dados via socket');
    });
}

function pingApi() {
    alert('Pingando API');
    $('#CS').html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>');

    $.ajax({
        type: "GET",
        url: serverApi,
    }).done(function (res) {
        serverApiStatus = true;
        $('#CS').html('OK');
        formApiLogin = true;
        alert('API respondendo corretamente');
        if (formApiLogin) {
            $('.form-api-login').removeClass('d-none');
        }
    }).fail(function () {
        serverApiStatus = false;
        $('#CS').html('Fail');
        alert('Falha ao pingar a API');
    });
}

function pingServer() {
    alert('Pingando o servidor');
    $('#SS').html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>');

    $.ajax({
        type: "GET",
        url: server,
    }).done(function (res) {
        serverStatus = true;
        $('#SS').html('OK');
        alert('Servidor respondendo corretamente');
    }).fail(function () {
        serverStatus = false;
        $('#SS').html('Fail');
        alert('Falha ao pingar o servidor');
    });
}

function toLogin() {
    alert('Iniciando login no servidor');
    var data = JSON.stringify({ username: user, password: pass, passwordCustom: null });

    $.ajax({
        type: "POST",
        url: server + 'api/login',
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    }).done(function (res) {
        accessToken = res.accessToken;
        login = true;
        alert('Login realizado com sucesso');
    }).fail(function (res) {
        console.log(res);
        alert('Falha ao realizar login no servidor');
    });
}

function toLoginApi(user, pass) {
    alert('Enviando requisição de login para a API');
    var data = JSON.stringify({
        email: user,  // Campos com letras minúsculas
        senha: pass   // Campos com letras minúsculas
    });

    $.ajax({
        type: "POST",
        url: serverApi + 'api/login',  // Certifique-se de que este seja o endpoint correto
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    }).done(function (res) {
        if (res.usuario == null) {
            alert('Usuário ou senha inválida!');
        } else {
            loggedApiUser = res.usuario;
            loginApi = true;
            alert('Login na API realizado com sucesso');

            formApiLogin = false;
            if (!formApiLogin) {
                $('.form-api-login').addClass('d-none');
            }

            formUnidades = true;
            if (formUnidades) {
                $('.form-api-unidades').removeClass('d-none');
            }

            loggedApiUser.CondominioUnidades.forEach(element => {
                $('#unidadeSelect').append('<option value="' + element.Condominio.$oid + '">' + element.Nome + '</option>');
            });
        }
    }).fail(function (err) {
        console.error('Erro ao tentar fazer login na API: ', err);
        alert('Erro de autenticação. Verifique suas credenciais.');
    });
}

function start() {
    setInterval(function () {
        if (!serverApiStatus) {
            pingApi();
        }

        if (!serverStatus) {
            pingServer();
        }

        if (serverApiStatus && serverStatus) {
            if (condominio) {
                socketData();
            }
            if (login && loginApi) {
                if (condominio) {
                    getAcessos();
                    delAcessos();
                }
            } else {
                toLogin();
            }
        }
    }, 5000);
}

function delAcessos() {
    alert('Deletando acessos');
    let data = { condId: condominio };

    $.ajax({
        type: "GET",
        url: serverApi + 'api/acessos/get-del-access',
        contentType: "application/json; charset=utf-8",
        data: data,
        dataType: "json",
    }).done(function (res) {
        res.forEach(element => {
            deleteItem('api/user/', element.Id);
            deleteItem('api/rule/', element.ruleId);
            deleteItem('api/schedule/', element.timeId);

            $.ajax({
                type: "POST",
                url: serverApi + 'api/acessos/complete-delete/' + element._id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
            }).done(function () {
                alert('Acesso deletado com sucesso: ' + element._id);
            });
        });
    }).fail(function () {
        alert('Falha ao deletar acessos');
    });
}

function deleteItem(endpoint, id) {
    alert('Deletando item: ' + endpoint + id);
    $.ajax({
        type: "DELETE",
        url: server + endpoint + id,
        contentType: "application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType: "json",
    }).done(function () {
        alert('Item deletado com sucesso: ' + id);
    }).fail(function () {
        alert('Falha ao deletar item: ' + id);
    });
}

function getAcessos() {
    alert('Obtendo acessos');
    let data = { condId: condominio };

    $.ajax({
        type: "GET",
        url: serverApi + 'api/acessos',
        contentType: "application/json; charset=utf-8",
        data: data,
        dataType: "json",
    }).done(function (res) {
        res.forEach(element => {
            var schedule = createScheduleData(element);
            var scheduleRegistred = createSchedule(schedule, element);
        });
        alert('Acessos obtidos com sucesso');
    }).fail(function () {
        alert('Falha ao obter acessos');
    });
}

function createScheduleData(element) {
    alert('Criando dados de agenda');
    var schedule = {
        'name': 'Niot-' + element._id,
    };

    var timeStart, timeEnd;
    switch (element.PeriodoAcesso) {
        case 'DiaTodo':
            timeStart = "0";
            timeEnd = "86340";
            break;
        case 'manha':
            timeStart = "25200";
            timeEnd = "43140";
            break;
        case 'tarde':
            timeStart = "43200";
            timeEnd = "64740";
            break;
        case 'noite':
            timeStart = "64800";
            timeEnd = "86340";
            break;
        case 'madrugada':
            timeStart = "0";
            timeEnd = "25140";
            break;
        case 'comercial':
            timeStart = "32400";
            timeEnd = "64800";
            break;
    }

    var weekdays = {
        'seg': 'monday',
        'ter': 'tuesday',
        'qua': 'wednesday',
        'qui': 'thursday',
        'sex': 'friday',
        'sab': 'saturday',
        'dom': 'sunday'
    };

    for (var day in weekdays) {
        if (element.Weekdays.includes(day)) {
            schedule[weekdays[day] + 'Start'] = timeStart;
            schedule[weekdays[day] + 'End'] = timeEnd;
        }
    }

    alert('Dados de agenda criados');
    return schedule;
}

function createSchedule(schedule, originElement) {
    alert('Criando agenda');
    var data = JSON.stringify(schedule);
    $.ajax({
        type: "POST",
        url: server + 'api/schedule',
        data: data,
        contentType: "application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType: "json",
    }).done(function (res) {
        createUser('Niot-' + originElement._id, originElement.CodAcesso, res, originElement);
        alert('Agenda criada com sucesso');
    }).fail(function () {
        alert('Falha ao criar agenda');
    });
}

function createUser(newUser, newPass, schedule, originElement) {
    alert('Criando usuário');
    $.ajax({
        type: "POST",
        url: server + 'api/qrcode/userqrcode',
        contentType: "application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType: "json",
    }).done(function (qrCodeId) {
        var data = JSON.stringify({
            credits: [],
            inativo: false,
            blackList: false,
            contingency: false,
            cards: [{ type: 2, number: qrCodeId, idType: 1 }],
            groups: [1],
            groupsList: [{ contingency: false, disableADE: false, id: 1, name: "Departamento Padrão" }],
            name: newUser,
            password: newPass,
            password_confirmation: newPass
        });

        $.ajax({
            type: "POST",
            url: server + 'api/user',
            data: data,
            contentType: "application/json; charset=utf-8;",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            dataType: "json",
        }).done(function (userRegistred) {
            $.ajax({
                type: "POST",
                url: server + 'api/qrcode/getqrcode',
                data: qrCodeId,
                contentType: "application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType: "json",
            }).done(function (qrcode) {
                assoc(schedule, userRegistred, originElement, qrcode);
                alert('Usuário criado com sucesso');
            }).fail(function () {
                alert('Falha ao obter QRCode do usuário');
            });
        }).fail(function () {
            alert('Falha ao criar usuário');
        });
    }).fail(function () {
        alert('Falha ao gerar QRCode do usuário');
    });
}

function assoc(scheduleRegistred, userRegistred, originElement, qrcode) {
    alert('Associando usuário à agenda');
    var data = JSON.stringify({
        "name": "Niot-" + originElement._id,
        "ReEntryLockEnabled": 0,
        "EscortEnabled": 0,
        "IsBiometryDisabled": false,
        "IsCardDisabled": false,
        "IsPasswordDisabled": false,
        "ManualAuthorizationOption": 0,
        "RandomInspectPercent": 0.1,
        "EscortPeriod": 8,
        "users": [userRegistred.newID],
        "areas": [1],
        "schedules": [scheduleRegistred.newID],
        "devices": [],
        "creditTypes": [],
        "selectedEscorted": [],
        "selectedEscortUsers": [],
        "idType": 1
    });

    $.ajax({
        type: "POST",
        url: server + 'api/rule',
        data: data,
        contentType: "application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType: "json",
    }).done(function (assoc) {
        updateCode(originElement, userRegistred, scheduleRegistred, assoc, qrcode);
        alert('Usuário associado à agenda com sucesso');
    }).fail(function () {
        alert('Falha ao associar usuário à agenda');
    });
}

function updateCode(originElement, userRegistred, scheduleRegistred, assoc, qrcode) {
    alert('Atualizando código');
    var data = JSON.stringify({
        element: originElement,
        user: userRegistred,
        schedule: scheduleRegistred,
        assoc: assoc,
        qrcode: qrcode
    });

    $.ajax({
        type: "POST",
        url: serverApi + 'api/acessos/complete',
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    }).done(function () {
        alert('Código atualizado com sucesso');
    }).fail(function () {
        alert('Falha ao atualizar código');
    });
}

async function monitor() {
    alert('Iniciando monitoramento');
    let response = await getData();
    monitorInteraction(response);
    setTimeout(() => { monitor(); }, 15000);
}

function getData() {
    alert('Obtendo dados de monitoramento');
    return $.ajax({
        url: server + "api/access/monitor?areas=&events=&limite=15&mode=logs&modevalue=&parkings=",
        type: 'GET',
        contentType: "application/json; charset=utf-8;",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        dataType: "json",
    }).done(function () {
        alert('Dados de monitoramento obtidos com sucesso');
    }).fail(function () {
        alert('Falha ao obter dados de monitoramento');
    });
}

function monitorInteraction(response) {
    alert('Processando interações de monitoramento');
    if (response.data.length > 0) {
        let allNotifications = [];

        response.data.forEach(element => {

            let device = element.idDevice;
            let userId = element.idUser;
            let eventCode = element.eventCode;
            let time = element.time;

            let user = $.ajax({
                type: "GET",
                url: server + 'api/user/' + userId,
                contentType: "application/json; charset=utf-8;",
                headers: {
                    "Authorization": "Bearer " + accessToken
                },
                dataType: "json",
                async: false
            }).responseJSON;

            if (user.name.startsWith("Niot-")) {

                userNiotId = user.name.split("-")[1];

                let theData = {
                    userId: userNiotId,
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
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            headers: {
                "Authorization": "Bearer " + accessToken
            },
        }).done(function () {
            alert('Interações de monitoramento processadas com sucesso');
        }).fail(function () {
            alert('Falha ao processar interações de monitoramento');
        });
    }
}
