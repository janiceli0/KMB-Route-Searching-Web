// Route List API
const input = document.querySelector("input#route");
const search = document.querySelector("#searchBtn");
const orderList = document.querySelector("ul");
const coll = document.getElementsByClassName("collapsible");
const loaderWrapper = document.querySelector(".loader-wrapper");

const arrowSymbol = "\u2192";

let routeNo = [];
let startStop = [];
let endStop = [];
let bound = "";
let type = "";
let uniqueNo = [];
let routeNameList = [];
let refreshIcon = true;
let stopLi;

search.addEventListener("click", function () {
  removeChoice();
  removeList();
  const whitespaceRemoved = input.value.replace(/\s/g, "");
  input.value = whitespaceRemoved.toUpperCase();
  //First API
  async function fetchRoute1() {
    const res = await fetch(
      "https://data.etabus.gov.hk/v1/transport/kmb/route/"
    );
    const dataRoute1 = await res.json();

    //check route No.
    for (i = 0; i < dataRoute1.data.length; i++) {
      routeNo.push(dataRoute1.data[i]["route"]);
    }

    if (routeNo.includes(input.value) === false) {
      alert("請輸入正確路線～");
    }

    //push route stat and endpoint
    for (i = 0; i < dataRoute1.data.length; i++) {
      if (input.value == dataRoute1.data[i]["route"]) {
        const choiceDiv = document.querySelector("#routeChoice");
        const choiceBtn = document.createElement("button");
        choiceBtn.classList.add("choice");

        let startStop = dataRoute1.data[i]["orig_tc"];
        let endStop = dataRoute1.data[i]["dest_tc"];
        choiceBtn.append(`${startStop} ${arrowSymbol} ${endStop}`);
        choiceDiv.append(choiceBtn);
      }
    }
  }
  fetchRoute1();
});

const buttonsContainer = document.getElementById("routeChoice");
buttonsContainer.addEventListener("click", function (event) {
  removeList();
  async function fetchRoute() {
    const res = await fetch(
      "https://data.etabus.gov.hk/v1/transport/kmb/route/"
    );
    const dataRoute = await res.json();

    if (event.target.classList.contains("choice")) {
      let route = event.target.textContent.split("→");
      startStop = route[0].trim();
      endStop = route[1].trim();
    }
    // console.log(startStop, endStop);

    for (j = 0; j < dataRoute.data.length; j++) {
      if (
        input.value == dataRoute.data[j]["route"] &&
        startStop == dataRoute.data[j]["orig_tc"] &&
        endStop == dataRoute.data[j]["dest_tc"]
      ) {
        bound = dataRoute.data[j]["bound"];
        type = dataRoute.data[j]["service_type"];
      }
    }
    // console.log("bound" + bound + "," + "type" + type);

    //Second API
    const fetchInfo = async (stop) => {
      const res = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route-stop"
      );
      const dataRouteId = await res.json();
      for (h = 0; h < dataRouteId.data.length; h++) {
        if (
          input.value == dataRouteId.data[h]["route"] &&
          bound == dataRouteId.data[h]["bound"] &&
          type == dataRouteId.data[h]["service_type"]
        ) {
          uniqueNo.push(dataRouteId.data[h]["stop"]);
        }
      }

      // console.log(uniqueNo);

      //Third API
      const fetchStopName = async (stopid) => {
        const res = await fetch(
          "https://data.etabus.gov.hk/v1/transport/kmb/stop/" + stopid
        );
        const dataRouteName = await res.json();

        // console.log(dataRouteName.data["name_tc"]);

        const circleDiv = document.createElement("div");
        circleDiv.classList.add("circle");
        const paragraph = document.createElement("p");
        circleDiv.append(paragraph);

        const stopNameSeq = document.createElement("button");
        stopNameSeq.classList.add("stopList");
        stopNameSeq.append(dataRouteName.data["name_tc"]);

        const arrowSign = document.createElement("img");
        arrowSign.classList.add("arrow");
        arrowSign.setAttribute(
          "src",
          "https://cdn-icons-png.flaticon.com/512/5800/5800691.png"
        );

        const firstDiv = document.createElement("div");
        firstDiv.classList.add("stopName");
        firstDiv.classList.add("collapsible");
        firstDiv.append(circleDiv, stopNameSeq, arrowSign);

        const list = document.createElement("li");
        list.classList.add("step");

        list.append(firstDiv);
        orderList.append(list);

        const secondDiv = document.createElement("div");
        secondDiv.classList.add("content");
        secondDiv.setAttribute("id", `${stopid}`);
        list.append(secondDiv);

        const thirdDiv = document.createElement("div");
        thirdDiv.classList.add("icon");
        const reset = document.createElement("img");
        reset.setAttribute("id", "refresh");
        reset.setAttribute(
          "src",
          "https://cdn-icons-png.flaticon.com/512/10729/10729013.png"
        );
        thirdDiv.append(reset);
        list.append(thirdDiv);

        //collapsible
        for (let z = 0; z < coll.length; z++) {
          coll[z].addEventListener("click", function () {
            const isActive = this.classList.contains("active");

            // Close all collapsibles
            const activeCollapsible = document.querySelector(
              ".collapsible.active"
            );
            if (activeCollapsible && activeCollapsible !== this) {
              activeCollapsible.classList.remove("active");
              const activeContent = activeCollapsible.nextElementSibling;
              activeContent.style.display = "none";
              const activeArrow = activeCollapsible.querySelector(".arrow");
              activeArrow.style.transform = "rotate(0deg)";
            }

            // Toggle the clicked collapsible
            if (!isActive) {
              this.classList.toggle("active");
              const content = this.nextElementSibling;
              content.style.display = "block";
              const arrowUp = this.querySelector(".arrow");
              arrowUp.style.transform = "rotate(180deg)";
            }
          });
        }
        reset.addEventListener("click", function (event) {
          const stopId = event.target
            .closest(".step")
            .querySelector(".content").id;
          console.log(stopId);
          refreshIcon = false;
          refreshEta(stopId);
        });
      };

      // Forth API - ETA

      const fetchStopEta = async (stopIDD, routeNum, service) => {
        const res = await fetch(
          "https://data.etabus.gov.hk/v1/transport/kmb/eta/" +
            stopIDD +
            "/" +
            routeNum +
            "/" +
            service
        );
        const dataRouteEta = await res.json();

        for (p = 0; p < dataRouteEta.data.length; p++) {
          if (bound == dataRouteEta.data[p]["dir"]) {
            // console.log(dataRouteEta.data[p]["eta"]);
            // console.log(dataRouteEta.data[p]["rmk_tc"]);
            const paragraph1 = document.createElement("p");
            if (dataRouteEta.data[p]["rmk_tc"] == "原定班次") {
              paragraph1.append(
                dataRouteEta.data[p]["eta"].slice(11, 16) +
                  " " +
                  dataRouteEta.data[p]["rmk_tc"]
              );
            } else {
              const spanElement = document.createElement("span");
              spanElement.style.color = "red";
              spanElement.textContent = "實時班次";
              paragraph1.append(
                dataRouteEta.data[p]["eta"].slice(11, 16) + " "
              );
              paragraph1.appendChild(spanElement);
            }

            const listOut = document.getElementById(`${stopIDD}`);
            listOut.append(paragraph1);
          }
        }
      };

      loaderWrapper.style.display = "block";
      setTimeout(function () {
        loaderWrapper.style.display = "none";
        for (y = 0; y < uniqueNo.length; y++) {
          fetchStopName(uniqueNo[y]);
          fetchStopEta(uniqueNo[y], input.value, type);
        }
      }, 1000);
      function refreshEta(idstop) {
        if (refreshIcon == false) {
          const etabus = document.getElementById(idstop);

          while (etabus.firstChild) {
            etabus.firstChild.remove();
          }

          fetchStopEta(idstop, input.value, type);
        }
      }
    };
    fetchInfo();
  }
  fetchRoute();
});

function removeChoice() {
  const btn = document.querySelector("#routeChoice");

  while (btn.firstChild) {
    btn.firstChild.remove();
  }
}

function removeList() {
  stopLi = document.getElementsByClassName("step");
  console.log(stopLi.length);
  for (let i = 0; i < stopLi.length; i++) {
    console.log(stopLi[i]);
  }
}
