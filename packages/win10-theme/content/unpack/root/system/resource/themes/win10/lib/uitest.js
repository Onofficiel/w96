//!wrt

new w96.StandardWindow({
  bodyClass: "fluent",
  body: `
    <style>
      .fluent {
        display: grid;
        place-items: center;

        color: #fff;
        background-color: #000;
      }
    </style>

    <fluent-button
      img="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYUlEQVQ4EWNgYGBg+E8YvP///78BSC1WANKPVQIqCDX/Pk5DiDTA4P///9gNIcYAkGNALsBqCDEGQL0Bo96jeJmQASiKoYGOIjZqACQlogQKAQ5GmGEIjFADQOFACoAFEwBbAPWrypS00QAAAABJRU5ErkJggg=="
    >
    Documents
    </fluent-button>
  `
}).show();