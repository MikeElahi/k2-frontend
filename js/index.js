navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

const PATH='/api/';

navigator.getUserMedia(
    {
        video: {
            facingMode: "environment"
        }
    },
    function (stream) {
        var video = document.querySelector("video");
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
            video.play();
        };
    },
    function (err) {
        console.log("The following error occurred: " + err.name);
    }
);
let uuid = '';
const existing_only = document.getElementById("existing-only");

function getUUID() {
    // check if uuid exists in sessionStorage
    if (sessionStorage.getItem('uuid') !== null) {
        uuid = sessionStorage.getItem('uuid');
        refreshDashboardLink();
        existing_only.style.display = 'inline';
        return;
    }

    // "uuid" get parameter
    let urlParams = new URLSearchParams(window.location.search);
    // Check if uuid is in url
    if (urlParams.has("uuid")) {
        uuid = urlParams.get('uuid');
        refreshDashboardLink();
        existing_only.style.display = 'inline';
    }
    else {
        axios.get(PATH + '/uuid').then(function (response) {
            uuid = response.data;
            // Set uuid cookie with indefinite expiry
            sessionStorage.setItem("uuid", uuid);
            refreshDashboardLink()

        }).catch(function (error) {
            alert("Failed to obtain UUID, Data cannot be saved.");
            // Wait for 5 seconds and refresh
            setTimeout(function () {
                location.reload();
            }   , 5000);
        })
    }
}

function refreshDashboardLink()
{
    const link_to_dashboard = document.getElementById("link-to-dashboard");
    link_to_dashboard.href = link_to_dashboard.href + "?uuid=" + uuid;
}
function capturePhoto() {
    const canvas = document.getElementById("canvas");
    const top_text = document.getElementById("top-text");
    const variable_text = document.getElementById("variable-text");
    const context = canvas.getContext("2d");
    const video = document.querySelector("video");

    [canvas.width, canvas.height] = [video.videoWidth, video.videoHeight];
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    variable_text.innerHTML = "Processing... (~1-2 minutes)";

    let percentage = null;
    const dataURL = canvas.toDataURL("image/jpeg", 1.0);
    axios.get(PATH + '/entities/' + uuid + '/check')
        .then(function (response) {
            percentage = null;
            send_request(dataURL, percentage);
        })
        .catch(function (error) {
            // percentage = prompt("What percentage of the image is covered by the wall?", "10");
            percentage = null;
            send_request(dataURL, percentage)
        })
}

function send_request(dataURL, percentage)
{
    const variable_text = document.getElementById("variable-text");
    axios.post(PATH, {
        uuid: uuid,
        image: dataURL,
        percentage: percentage,
    }).then(function () {
        variable_text.innerHTML = "Photo processed.";
        existing_only.style.display = 'inline';
    }).catch(function () {
        variable_text.innerHTML = "Photo failed to send.";
    });
}
function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts = url.split('?');
    if (urlparts.length >= 2) {

        var prefix = encodeURIComponent(parameter) + '=';
        var pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        return urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
    }
    return url;
}

function resetUUID()
{
    uuid = '';
    sessionStorage.removeItem('uuid');
    window.location.href = removeURLParameter(window.location.href, 'uuid');
    // Refresh
    window.location.reload();
}
// Run function if document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    getUUID();
});