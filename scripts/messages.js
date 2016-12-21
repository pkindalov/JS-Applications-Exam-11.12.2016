
function startApp() {
   sessionStorage.clear();
   showHideMenuLinks();
   showView('viewAppHome');

   $('#infoBox').hide();
   $('#errorBox').hide();
   $('#loadingBox').hide();


    $('#linkMenuAppHome').click(showHomeView);
    $('#linkMenuUserHome').click(showHomeViewUser);
    $('#linkMenuLogin').click(showLoginView);
    $('#linkMenuRegister').click(showRegisterView);
     $('#linkMenuMyMessages').click(showMyMessages);
    $('#linkMenuArchiveSent').click(sentMessagesScreen);
    $('#linkMenuSendMessage').click(showSendMessageView);
    $('#linkMenuLogout').click(logoutUser);
    $('#viewLogin input[type=submit]').click(loginUser);
    $('#viewRegister input[type=submit]').click(registerUser);
    $('#viewSendMessage input[type=submit]').click(sendMessage);
    $('#linkUserHomeMyMessages').click(showMyMessages);
    $('#linkUserHomeArchiveSent').click(sentMessagesScreen);
    $('#linkUserHomeSendMessage').click(showSendMessageView);


    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });


    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });



    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_BkcPAdqXl";
    const kinveyAppSecret =
        "389ad52dbddd4efeb2fbd791ac3fc6d1";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };






    function showHideMenuLinks() {
        $('#linkMenuAppHome').show();
        if(sessionStorage.getItem('authToken')){
            $('.useronly').show();
            $('.anonymous').hide();
        }else {
            $('.anonymous').show();
            $('.useronly').hide();
        }

    }





    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }


    function showHomeView() {
        showView('viewAppHome');
    }

    function showHomeViewUser() {
        showView('viewUserHome');
    }

    function showLoginView() {
        showView('viewLogin');
        $('#viewLogin input[name=username]').val('');
        $('#viewLogin input[name=password]').val('');
    }

    function showRegisterView() {
        showView('viewRegister');
        $('#viewRegister input[name=username]').val('');
        $('#viewRegister input[name=password]').val('');
        $('#viewRegister input[name=name]').val('');
    }


    function showSendMessageView() {
        showView('viewSendMessage');
        $('#msgText').val('');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey,
            headers: getKinveyUserAuthHeaders(),
            success: getReceivers,
            error: handleAjaxError
        });


        function getReceivers(data) {

            for(let recepient of data){
                $("#msgRecipientUsername").append(`<option>${recepient.username}</option>`);
            }

        }

    }






    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        
        
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showHomeViewUser();
            showInfo('User registration successful.');
        }


    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        let name = userInfo.name;
        sessionStorage.setItem('name', name);
        $('#viewUserHomeHeading').text(
            "Welcome, " + username + "!");
        $('#spanMenuLoggedInUser').text(
            "Welcome, " + username + "!");
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }



    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);

    }


    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }




    function loginUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });


        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showHomeViewUser();
            showInfo('Login successful.');
        }



    }

    function logoutUser(event) {
        event.preventDefault();

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/_logout",
            headers: getKinveyUserAuthHeaders(),
            success: logoutSuccess,
            error: handleAjaxError
        });

        function logoutSuccess(userInfo) {
            sessionStorage.clear();
            showHideMenuLinks();
            showHomeView();
            showInfo('Logout successful.');
        }
    }


    function showMyMessages() {
       $('#myMessages table').empty();
       showView('viewMyMessages');

       let username = sessionStorage.getItem('username');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/messages?query={"recipient_username":"${username}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMyMessages,
            error: handleAjaxError
        });
        
        function loadMyMessages(messages) {
            showInfo("My messages loaded");
            if(messages.length == 0){
                $('#myMessages').text('No messages in mailbox');
            }else {
                let messageTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>From</th><th>Message</th>',
                        '<th>Data Received</th>'));

                for (let message of messages)
                    appendMessageRow(message, messageTable);
                $('#myMessages').append(messageTable);


                function appendMessageRow(message, messageTable) {

                    messageTable.append($('<tr>').append(
                        $('<td>').text(message.sender_username),
                        $('<td>').text(formatSender(message.sender_name, message.sender_username)),
                        $('<td>').text(formatDate(message._kmd.lmt))
                    ));
                }



            }
        }


    }



    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }






    function sentMessagesScreen() {
        $('#sentMessages table').empty();
        showView('viewArchiveSent');



        let username = sessionStorage.getItem('username');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/messages?query={"sender_username":"${username}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadArchiveMessages,
            error: handleAjaxError
        });

        function loadArchiveMessages(messages) {
            showInfo("My messages loaded");
            if(messages.length == 0){
                $('#sentMessages').text('No messages in mailbox');
            }else {
                let messageTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Data Sent</th><th>Actions</th>'));

                for (let message of messages)
                    appendMessageRow(message, messageTable);
                $('#sentMessages').append(messageTable);


                function appendMessageRow(message, messageTable) {



                    let deleteLink = $('<a href="#">[Delete]</a>')
                        .click(function () { deleteMessage(message) });


                    //let to = $( "#msgRecipientUsername option:selected" ).text();

                    messageTable.append($('<tr>').append(
                        $('<td>').text(message.recipient_username),
                        $('<td>').text(message.text),
                        $('<td>').text(formatDate(message._kmd.lmt)),
                        $('<td>').append(deleteLink)
                    ));



                }


            }
        }


    }


    function deleteMessage(message) {

        $.ajax({
            method: "DELETE",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/messages/" + message._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteMessageSuccess,
            error: handleAjaxError
        });
        function deleteMessageSuccess(response) {
            showInfo('Message deleted.');
            sentMessagesScreen();
        }

    }



















    function sendMessage(event) {
        event.preventDefault();




        let receiver = $('#msgRecipientUsername option:selected').text();
        let message = $('#msgText').val();
        let sender = sessionStorage.getItem('username');
        let senderName = sessionStorage.getItem('name');

        let data = {
            sender_username: sender,
            sender_name: senderName,
            recipient_username: receiver,
            text: message
        };

        $.ajax({
            method: "POST",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/messages/",
            headers: getKinveyUserAuthHeaders(),
            data: data,
            success: sendMessageSuccess,
            error: handleAjaxError
        });

        function sendMessageSuccess(response) {
            showInfo('Message sent.');
            sentMessagesScreen();
        }





    }







}