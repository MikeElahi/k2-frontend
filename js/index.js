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
    // check if uuid cookie exists
    if (document.cookie.split(';').filter((item) => item.includes('uuid=')).length) {
        uuid = document.cookie.split('; ').find(row => row.startsWith('uuid')).split('=')[1];
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
            document.cookie = "uuid=" + uuid + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
            refreshDashboardLink()

        }).catch(function (error) {
            alert("Failed to obtain UUID, Data cannot be saved.");
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

getUUID()