<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      class="widget-default-style flex flex-col p-1 min-h-0"
      style="width: 23rem; max-height: 45rem"
    >
      <!-- minHeight to handle too overpush -->
      <div 
        class="flex-1 flex flex-col min-h-0 border rounded"
        :style="{ minHeight: !config.compact ? '20rem' : '10rem' }"
      >
         <!--  ref to get exposed currency sum -->
        <PriceTrackPanel
          ref="panel"
          :data="config"
          :is-shown="isShown"
          init-mode="pinned"
          :init-compact="true"
        />
      </div>

      <!-- base | target | modifier -->
      <div class="grid grid-cols-3 gap-0.5 px-1 pt-2 shrink-0">
        <button
          v-for="slot in LINK_SLOTS"
          :key="slot"
          :class="$style.link"
          :disabled="!config[slot].url"
          :title="config[slot].url || t(`:${slot}`)"
          @click="openUrl(config[slot].url)"
        >
          <span class="flex mb-2 shrink-0">
            <img v-if="slot=='base'" class="w-4 h-4" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iaGVpZ2h0OiA1MTJweDsgd2lkdGg6IDUxMnB4OyI+PHBhdGggZD0iTTAgMGg1MTJ2NTEySDB6IiBmaWxsPSIjMDAwMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDEiPjwvcGF0aD48ZyBjbGFzcz0iIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBzdHlsZT0iIj48cGF0aCBkPSJNMjAuNTYzIDIwLjg0NHY0NC41OTNsNzMuMTI0IDcyLjkwN2M0Ljg3OC03Ljk0NSAxMC45NjItMTUuNjUgMTguMTI2LTIyLjgxMyA3LjE1Mi03LjE1IDE0LjgyNS0xMy4xOTQgMjIuNzUtMTguMDZMNTguMTU2IDIwLjg0M0gyMC41NjN6bTE1OS44MTIgODEuMDYyYy0uNTY2LS4wMDUtMS4xMzguMDE0LTEuNzIuMDMtMy4wOTcuMDk3LTYuNDIuNTIyLTkuOTA1IDEuMjgzLTEzLjk0MiAzLjA0My0yOS45NzMgMTEuNzUzLTQzLjc1IDI1LjUzLTEzLjc3NyAxMy43NzctMjIuNDg3IDI5LjgwOC0yNS41MyA0My43NS0yLjkwNSAxMy4yOTYtLjgxIDIzLjkzNSA1LjI4IDMwLjc4IDUuNC0yMC4zNTQgMTcuNTg3LTQxLjE4IDM1LjU5NC01OS4xODYgMTguMDI0LTE4LjAyNCAzOC44NzYtMzAuMjAzIDU5LjI1LTM1LjU5NC00LjcxOC00LjIyMy0xMS4yNS02LjUyNi0xOS4yMi02LjU5NHptNDAuNDcgMjIuMTU2Yy0zLjk3Ny4wOTYtOC4xOS42MjQtMTIuNTk1IDEuNTYzLTE3LjYyIDMuNzU1LTM3LjYwMyAxNC41NzItNTQuNzIgMzEuNjg4LTE3LjExMyAxNy4xMTUtMjcuOTMgMzcuMDY3LTMxLjY4NSA1NC42ODctMy43NTUgMTcuNjItLjYzMyAzMi4wODYgOC40NyA0MS4xODguOTA1LjkwNiAxLjg5NCAxLjc0NCAyLjkwNSAyLjUzIDQuNjM1LTMxLjQ5IDE4LjUwNi01OS4wODQgMzkuNDM2LTgwIDIwLjY5LTIwLjY3NCA0Ny44OTQtMzQuNDY1IDc4LjkzOC0zOS4yNWEzMC44OCAzMC44OCAwIDAgMC0yLjE1Ni0yLjQwNWMtNi44MjctNi44MjctMTYuNjY4LTEwLjI4OC0yOC41OTQtMTB6bTU1LjM0MyAyOC42NTdjLTM2LjU2LjE2Ny02OC4wMTcgMTMuOTA2LTkwLjM0NCAzNi4yMTgtMi4yNCAyLjI0LTQuMzc1IDQuNTgtNi40MzggNyAyMi40MyAxMS42NTQgMzcuMzE3IDI2LjU3IDQ2LjMxMyA0My4wNjIgMTAuNTc1IDE5LjM5MiAxMi45NzcgNDAuMzkzIDEyLjE1NSA2MC4wM2wtMTguNjg4LS43OGMuNzM2LTE3LjU2NS0xLjQ0OC0zNC44NjMtOS44NzUtNTAuMzEzLTcuNDY2LTEzLjY4OC0xOS44NzQtMjYuMzE3LTQxLjAzLTM2LjY4Ny0xOC4xNTUgMjkuNjgtMjQuNDk3IDY4LjY2LTEyLjY1NyAxMTEuODQ0IDM2LjQ3MiAzLjE0NiA3Mi44ODggMjQuMjkgODYuMzc1IDY2LjI1IDQ1LjAyNS02LjM3NSAxMTkuMzM2IDI2LjU1NyAxMjcuMjIgNjQuMjUgMzkuOTYgMTguNDc3IDg0LjU4OCAzMy4zNjggMTI1LjcxNyA0NS4wOTQtMTEuMzMtMzUuODczLTI0LjM4LTgxLjA5Ny00MC43MTgtMTE2Ljk3LTM0LjUzLTIxLjUwNi00OS43MDItNjIuODItNDYuNjI2LTEwNi4zNDMtNDAuMzM2LTMwLjEwNS03MC4xOC02OS41MTgtNzQuNzgtMTEyLjYyNS0xOS43ODItNi45NS0zOC44MDYtMTAuMTEzLTU2LjYyNy0xMC4wM3ptLTkuNTMyIDQ1LjVjMTAuMjkzIDUyLjU0IDU4LjY2NyA4Ni4xNyAxMDAuNjI1IDkzLjcxOGwtMy4zMSAxOC4zNzVjLTExLjA5LTEuOTk2LTIyLjQ3OC01LjUwMy0zMy41OTUtMTAuNDM4LTYuOTMgMTkuNjE1IDEuMzQgNDEuMjUyIDE5Ljc1IDYwIDE5LjYzOCAxOS45OTggNTAuNDEyIDM0LjkwNiA4MS4wOTQgMzUuOTdsLS42NTggMTguNjg2Yy0zNi4xNTQtMS4yNS03MC42NTctMTguMDE0LTkzLjc4LTQxLjU2LS45OC0xLTEuOTM2LTIuMDA0LTIuODc2LTMuMDMzLTE1LjQ3LTEyLjM2Mi0yNy42MTUtMTYuMTItMzguNDctMTUuNS0xMC45MTguNjI0LTIxLjU5OCA2LjAxMi0zMy4wMyAxNS4wNjNsLTExLjU5NC0xNC42NTZjMTMuMDQzLTEwLjMyNyAyNy4yOTUtMTguMTM0IDQzLjU2My0xOS4wNjMgNi4zNzgtLjM2MyAxMi45LjM3MyAxOS41NjMgMi4yODMtNS42MzctMTUuMTg4LTYuNDI4LTMxLjM0NC0uMjUtNDYuODEzLTMxLjAzLTE4LjUwOC01Ny4zOTItNDguODQ0LTY1LjM0NC04OS40MzhsMTguMzEyLTMuNTkzeiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIxIj48L3BhdGg+PC9nPjwvc3ZnPg==" />
            <img v-if="slot=='target'" class="w-4 h-4" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJyBzdHlsZT0naGVpZ2h0OiA1MTJweDsgd2lkdGg6IDUxMnB4Oyc+PGNpcmNsZSBjeD0nMjU2JyBjeT0nMjU2JyByPScyNTYnIGZpbGw9JyMwMDAwMDAnIGZpbGwtb3BhY2l0eT0nMC4wMSc+PC9jaXJjbGU+PGcgY2xhc3M9JycgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCwwKScgc3R5bGU9Jyc+PHBhdGggZD0nTTE4LjUwNiAxOS44OTV2MzcuNTZMMTM1LjExIDE3NC4wNmwzMy43NTUtMzMuNzU3TDQ4Ljk3IDE5Ljg5NUgxOC41MDd6bTI5Ni45MjQgODEuNjA3Yy04LjM5OCAxNy42OTUtMTcuNTggMzQuNTE0LTI3LjU1NSA1MC40OCA1My4wNTIgNTUuNiAxMDkuMDk0IDE2NS4xNTUgMTQ1LjYwMiAyNzAuODI3bDYuMzMyIDE4LjMyNy0xOC4yOC02LjQ2N2MtMTA0LjY4Ny0zNy4wMzQtMjIwLjYyLTkxLjI2NC0yNzQuMzc0LTE0MS45NjctMTUuOTcyIDkuOTgtMzIuNzkzIDE5LjE2NS01MC40OSAyNy41NjMgNTMuNjkzIDM1LjY4NSAxMjEuNTcgNjkuMjIyIDE4OS40OTYgOTUuMTY2LTE0LjQzNyA3LjE4OC0yOS45MzggMTMuNTktNDYuNTggMTkuMjdsLjAwMi4wMDNjNjguMjY0IDM4LjYzIDE3NS41NyA2NS40NyAyNTQuNDEyIDY0LjEyNyAxLjMzLTc4LjA1Mi0yNy4wOC0xODguOTUtNjQuMTI3LTI1NC40MTYtNS43NiAxNi44Ny0xMi4yNTcgMzIuNTctMTkuNTYgNDcuMTY2LTI2LjQ1OC02OS4yMDUtNjAuMzg3LTEzOC4xODItOTQuODgtMTkwLjA4em0tMTE3Ljg1OCAzNi41MjNMMTM1Ljc5IDE5OS44MWMzNC4yMDcgMzEuNjIgNjcuNzc1IDU2Ljc2MyA5NC43OTggNzEuNTk4IDE0LjQ1NCA3LjkzNSAyNy4wOTQgMTIuOTUgMzYuMzM0IDE0Ljc2MiA5LjI0IDEuODEyIDEzLjc3OC4zNCAxNS41NjQtMS40NDUgMS43ODYtMS43ODYgMy4yNi02LjMyNiAxLjQ0OC0xNS41NjUtMS44MTItOS4yNC02LjgzLTIxLjg4LTE0Ljc2NC0zNi4zMzQtMTQuODM1LTI3LjAyMy0zOS45NzYtNjAuNTktNzEuNTk4LTk0Ljh6bTc5Ljc2MiAzMC4wOGMtNC42NiA2LjgxLTkuNDggMTMuNDUtMTQuNDU3IDE5LjkyNiA4Ljg5MiAxMi41NTcgMTYuNTIgMjQuNTg3IDIyLjY3NiAzNS44MDIgOC41MTUgMTUuNTEgMTQuMzA2IDI5LjQzIDE2LjcxOCA0MS43MyAyLjQxNCAxMi4zIDEuNTI4IDI0LjI4LTYuNTcgMzIuMzc3LTguMDk2IDguMDk2LTIwLjA3NiA4Ljk4Mi0zMi4zNzYgNi41Ny0xMi4zLTIuNDEzLTI2LjIyLTguMjA2LTQxLjczLTE2LjcyLTExLjEtNi4wOTQtMjMtMTMuNjMyLTM1LjQxNC0yMi40MDVhNDQ3Ljc4MiA0NDcuNzgyIDAgMCAxLTIyLjg3NyAxNi43NmM0Ny4yNjMgNDIuMjEgMTQ5LjY2NCA5Mi4zMTcgMjQ1LjU0NSAxMjcuODczLTM1LjE5LTk1Ljc2Ni04Ni4zNDctMTkyLjYwMi0xMzEuNTE0LTI0MS45MTN6JyBmaWxsPScjZmZmJyBmaWxsLW9wYWNpdHk9JzEnPjwvcGF0aD48L2c+PC9zdmc+" />
            <img v-if="slot=='modifier'" class="w-4 h-4" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iaGVpZ2h0OiA1MTJweDsgd2lkdGg6IDUxMnB4OyI+PHBhdGggZD0iTTAgMGg1MTJ2NTEySDB6IiBmaWxsPSIjMDAwMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDEiPjwvcGF0aD48ZyBjbGFzcz0iIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBzdHlsZT0iIj48cGF0aCBkPSJNMzczLjU2MyAxOC40MDZjLTE1LjYxNi0uMTY3LTI3LjkxIDQuNjIyLTMyLjU2MyAxNC43NS0yMi43NzggNDkuNjA1LTQ4Ljc0MyA4Ny4xNC03OS4wOTQgMTE3LjI4YTYyLjgxNiA2Mi44MTYgMCAwIDEgOC45MzggMy43ODNjMTIuOTg3IDYuNzA4IDI1LjI2OCAxNy43OCAzNS4zMTIgMzAuODQzIDEwLjA0NCAxMy4wNjIgMTcuODUgMjguMTE0IDIwLjc4IDQzLjUuNzQ2IDMuOTA4IDEuMTYgNy44ODUgMS4xNTggMTEuODQzIDM4Ljk3LTI0LjM2IDg1LjA1OC00MS4yMjMgMTQwLjg3NS01MS4zMTIgMTQuOTEtMi42OTcgMjMuNjUyLTI4LjYzMiAyMS40MDUtNTguNjU2bC0zNS4xNTYtMSAzMC41Ni0yNC44MTNjLTQuMTQ4LTE0LjUwNy0xMS4wMTMtMjguNzU0LTIxLjE1NS00MC43Mi0xNS41MjgtMTguMzE0LTM2LjQzLTMxLjM3Ni01Ni43Mi0zOC42ODZMMzgxLjk0IDQwLjgxMmwyLjgxMi0yMS41Yy0zLjg3NS0uNTUtNy42MS0uODctMTEuMTg4LS45MDd6TTI0Ni45MzggMTY2LjU2MmMtMS4wNjMuMDUyLTIuMDYuMjI2LTMgLjQ3LTExLjk3NiAxMC4yNTQtMjQuNjEgMTkuNTk3LTM3LjkzOCAyOC4yOC44NDIuMzMgMS42Ny42NjcgMi41IDEuMDMyIDE0LjEyMyA2LjE5MiAyNy40MzggMTcuMTQ1IDM4LjQ3IDMwLjYyNSAxMy4zNTYgMTYuMzIyIDIzLjYyIDM2Ljk0IDI1LjYyNCA1Ny43NSAxMC4zMzQtMTAuMzY3IDIxLjI0LTE5Ljk0MyAzMi44NDQtMjguNzIgNC4wOTYtNi41NTUgNC45My0xNC40NjggMy4xMjUtMjMuOTM4LTIuMTg0LTExLjQ2LTguNjQyLTI0LjQzLTE3LjI1LTM1LjYyNS04LjYxLTExLjE5NC0xOS4zOC0yMC42MjItMjkuMDYzLTI1LjYyNS02LjA1Mi0zLjEyNi0xMS4xNTQtNC40NS0xNS4zMTMtNC4yNXptLTYxLjkwNyA0My4yODJjLTEuMzg1LjA1My0yLjY5LjI3LTMuOTY4LjU2Mi0zNyAyMC43NjItNzkuMDg4IDM3Ljk4NS0xMjcuMzEyIDU2IC41NzQuMDQyIDEuMTQuMDkzIDEuNzIuMTU2IDEwLjYyNyAxLjE1NiAyMS4wNzYgNS4wMDggMzEuMTU1IDEwLjg3NUwxMjQuMzEzIDI2MSAxMDguNSAyOTMuNzJjNS45OTUgNS40MzIgMTEuODAzIDExLjQ3NyAxNy4zNDQgMTggMjAuNzYgMjQuNDM0IDM3Ljk2NCA1NS44NjUgNDcuMDk0IDg4LjA5Mi4wMDIuMDEtLjAwMy4wMjIgMCAuMDMyIDIuOTggMTAuNTA4IDUuMTEgMjAuOTE2IDYuMzEyIDMxIDIwLjk5LTQ4LjQzOCA0NC4zOC04OS4yNiA3Mi4zNDQtMTIzIDcuMy0yMS40OC0yLjE4Ni00OC40MDgtMTkuMDYzLTY5LjAzLTkuNDQtMTEuNTM4LTIwLjk3Ni0yMC43MTgtMzEuNTMtMjUuMzQ1LTUuOTM2LTIuNjA0LTExLjI3LTMuODA4LTE1Ljk3LTMuNjI2em0xNDEuNjI2IDU0Ljg0NGMtNy4zMSA1LjA1LTE0LjQ2MiAxMC41MS0yMS40MzcgMTYuMzEyIDM5LjE2IDkuMjYgNjAuOTUzIDM1LjcyMiA4MC42NTUgNjIuMTU2IDEwLjQ2NCAxNC4wNCAyMC41OTggMjguMTEgMzMuMTI1IDQwLjY4OCAyNC4xOSA5LjE0NyA0My4xNyA2LjM4IDYzLjkwNi0xNC45MzgtOTIuMTY1LTI3Ljc4LTk2LjExLTkyLjYxLTE1Ni4yNS0xMDQuMjJ6TTQ4LjU5NCAyODQuOTA2Yy0xMC44NzMuMjI1LTE4LjI2IDUuNzU1LTIzLjM0NCAxNi41OTQtNS44MSAxMi4zODctNy4xMTQgMzIuNDcuNDM4IDU3LjA2MyA1Ljc1IDE4LjczIDE2LjUyIDM3LjcxOCAyOC43NSA1MS42MjUgMTIuMjMgMTMuOTA2IDI1LjkgMjIuMDc2IDM1LjM3NCAyMi40MDZoLjAzMmMzLjcxNy4xMyA2LjU1My0uNjgyIDguODEyLTIuNzVsLS4xODctLjE4OCAyLjA5My0yLjA5NGMuNzkzLTEuMTY4IDEuNTItMi41NDggMi4xODctNC4xODcgMi44MS02LjkgMy4yOC0xOC41NTItMS44NDQtMzMtNi44ODUtMTkuNDE3LTE5LjEyLTMxLjkzMi0zMy4zNzUtMzQuNzhsLTIyLjk2OC00LjU2NCAxOS44MTMtMTIuNSAzOC40Ny0yNC4xODZjLTE2LjY1LTE2LjgyMi0zNC41NS0yNy42MDctNDkuMzc2LTI5LjIyLTEuNy0uMTg0LTMuMzIzLS4yNS00Ljg3Ni0uMjE4em0yMzYuMjUgNS40MDYtMjQuNTMgMjUuMzc1YzEwMC40NDIgMTcuODc4IDU1LjQ1IDE0MS4wMDUgMTU5LjMxIDE3Ni4xODhsLTI0Ljc4LTU3LjI4YzMyLjc2NiAxNi4xNSA2Ny4zOSAyMi42MjMgOTcuNzIgMTIuMDMtMTM1Ljc3LTQxLjk0OC05Ni4zMi0xMjYuOTgzLTIwNy43Mi0xNTYuMzEzem0tMTY5LjQ3IDM4LjIyLTI1Ljk2OCAxNi4zNDNjMTMuMTggOC41IDIzLjIxIDIyLjU2NSAyOS4xMjUgMzkuMjUgMi41NyA3LjI0NCA0LjEzMyAxNC4yMDUgNC43NSAyMC43OGwyMy40NC0yMy4zNzRjLTguMDgtMTkuMTktMTkuMDM1LTM3LjU2Ni0zMS4zNDUtNTN6bTM4LjM3NiA3Mi4zNzQtNDIuMDYzIDQyLS4xNTYtLjE1NmMtNC4yNTUgMy45NDItOS40NTYgNi43NjUtMTUuMTg2IDcuOTM4IDIzLjI2OCAxNC44NzMgNDQuNjQ0IDE5LjM0NiA1Ni44MTIgOS41NjIgNC4yNi0zLjQyNiA3LjA0My04LjM2IDguNDctMTQuNDA2LS40MS0xMi42ODQtMi42MDItMjYuNjE1LTYuNjU3LTQwLjkwNi0uMzgyLTEuMzQ2LS44MDYtMi42ODYtMS4yMi00LjAzMnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PC9wYXRoPjwvZz48L3N2Zz4="/>
            <span class="text-gray-600 text-xs ml-2">{{ t(`:${slot}`) }}</span>
          </span>
          
          <span :class="$style.linkName">{{ config[slot].name || "?" }}</span>
        </button>
      </div>

      <!-- profit calc (local only, not persisted) -->
      <div class="grid grid-cols-3 gap-0.5 pb-1 shrink-0 relative">
        <!-- base / target -->
        <div v-for="side in calcSides" :key="side.key" class="flex flex-col gap-0.5 min-w-0">
          <input
            v-model.number="side.value"
            type="number"
            step="any"
            :class="$style.numInput"
          />
          <div :class="$style.unitBar">
            <button
              class="mr-1"
              :class="$style.unitBtn"
              :disabled="!config[side.key].url || side.loading"
              :title="side.error || t(':refresh')"
              @click="refreshPrice(side)"
            >
              <i
                class="fas fa-sync-alt text-xs"
                :class="{
                  'fa-spin': side.loading,
                  'text-red-500': side.error && !side.loading,
                }"
              />
            </button>
            <button
              v-for="o in CALC_UNITS"
              :key="o.id"
              :class="[$style.unitBtn, { border: side.unit === o.id }]"
              :title="o.id"
              @click="side.unit = o.id"
            >
              <img :src="o.icon" class="w-4 h-4" :class="{ 'opacity-40': side.unit !== o.id }" />
            </button>
          </div>
        </div>

        <!-- profit -->
        <div class="flex flex-col gap-0.5 min-w-0">
          <div
            :class="[$style.profitBox, profit >= 0 ? 'text-green-500' : 'text-red-500']"
            :title="`${fmt(toUnit(toDiv(calcTarget)))} − ${fmt(toUnit(toDiv(calcBase)))} − ${fmt(toUnit(sumDiv))}`"
          >
            {{ fmt(profit) }}
          </div>
          <div :class="$style.unitBar">
            <button
              v-for="o in CALC_UNITS"
              :key="o.id"
              :class="[$style.unitBtn, { border: calcOut === o.id }]"
              :title="o.id"
              @click="calcOut = o.id"
            >
              <img :src="o.icon" class="w-4 h-4" :class="{ 'opacity-40': calcOut !== o.id }" />
            </button>
          </div>
        </div>
      </div>

      <!-- steps -->
      <div v-if="!config.steps.length" class="text-center text-gray-600 px-4 py-2">
        <i class="fas fa-exclamation-triangle" />
        {{ t(":empty") }}
      </div>
      <div
        v-if="config.steps.length"
        class="flex flex-col gap-y-0.5 overflow-y-auto min-h-0 px-4 py-2"
        style="max-height: 30rem"
      >
        <div
          v-for="(step, idx) in config.steps"
          :key="step.id"
          :class="$style.step"
        >
          <span class="text-gray-600 w-4 text-right rounded pr-2">{{
            idx + 1
          }}</span>
          <span class="flex-1">{{ step.text }}</span>
          <button
            v-if="step.search"
            :class="$style.stepBtn"
            :title="step.search"
            @click="stashSearch(step.search)"
          >
            {{ step.btnText || step.search }}
          </button>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces.js";

export default {
  widget: {
    type: "crafting",
    instances: "multi",
    trNameKey: "crafting.name",
  } satisfies WidgetSpec,
};
</script>

<script setup lang="ts">
import { computed, inject, reactive, ref } from "vue";
import { MainProcess } from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";
import {
  LINK_SLOTS,
  emptyLink,
  type CraftingWidget,
  type LinkSlot,
} from "./widget.js";
import { fetchListingPrice } from "./trade-price.js";
import { useI18nNs } from "@/web/i18n";
import Widget from "../overlay/Widget.vue";
import PriceTrackPanel from "../price-track/PriceTrackPanel.vue";
import { DISPLAY_UNITS, type DisplayUnit } from "../price-track/widget.js";
import { useLeagues } from "@/web/background/Leagues";
import { openTradeSearch, toTradeId } from "@/web/trade-url";

const props = defineProps<{ config: CraftingWidget }>();

const wm = inject<WidgetManager>("wm")!;
const leagues = useLeagues();
const { t } = useI18nNs("crafting");

// all for local profit calc
const panel = ref<InstanceType<typeof PriceTrackPanel> | null>(null);
const CALC_UNITS = DISPLAY_UNITS.filter((o) => o.id !== "auto");
const calcBase = reactive({
  key: "base" as LinkSlot,
  value: 0,
  unit: "div" as DisplayUnit,
  loading: false,
  error: "",
});
const calcTarget = reactive({
  key: "target" as LinkSlot,
  value: 0,
  unit: "div" as DisplayUnit,
  loading: false,
  error: "",
});
type CalcSide = typeof calcBase;
const calcSides = [calcBase, calcTarget];
const calcOut = ref<DisplayUnit>("div");
const rateOf = (id: DisplayUnit) => panel.value?.rateOf(id) ?? 1;
const toDiv = (x: { value: number; unit: DisplayUnit }) =>
  (Number(x.value) || 0) * rateOf(x.unit);
const toUnit = (div: number) => div / rateOf(calcOut.value);
const sumDiv = computed(() => panel.value?.sumDiv ?? 0);
const profit = computed(() =>
  toUnit(toDiv(calcTarget) - toDiv(calcBase) - sumDiv.value),
);
const fmt = (n: number) => // round up
  Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : "0";

const isShown = computed(
  () =>
    props.config.wmWants === "show" &&
    (wm.active.value || !props.config.wmFlags.includes("invisible-on-blur")),
);

// widget creation
if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = []; // no blur
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.wmTitle = t(":name");
  props.config.base = emptyLink();
  props.config.target = emptyLink();
  props.config.modifier = emptyLink();
  props.config.steps = [];

  // PriceTrackData props
  props.config.entries = [];
  props.config.limit = 10;
  props.config.unit = "auto";
  props.config.compact = true;
  props.config.showSum = true;
  wm.show(props.config.wmId);
}

const openUrl = (url: string) =>
  openTradeSearch(url, leagues.selected.value?.id);

// pull the cheapest behind the slot url into the input
async function refreshPrice(side: CalcSide) {
  const url = props.config[side.key].url;
  if (!url || side.loading) return;

  side.loading = true;
  side.error = "";
  try {
    const price = await fetchListingPrice(toTradeId(url), leagues.selected.value?.id);
    if (!price) {
      side.error = t(":refresh_empty");
      return;
    }
    if (price.unit) {
      // side unit is the one toggle ui
      side.unit = price.unit;
      side.value = round(price.amount);
    } else if (price.divValue !== undefined) {
      side.value = round(price.divValue / rateOf(side.unit));
    } else {
      side.error = t(":refresh_currency", [price.currency]);
    }
  } catch (err) {
    side.error = (err as Error).message;
  } finally {
    side.loading = false;
  }
}

const round = (n: number) => Math.round(n * 100) / 100;

function stashSearch(text: string) {
  MainProcess.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "stash-search", text },
  });
}
</script>

<style lang="postcss" module>
.link {
  @apply flex flex-col items-center justify-center min-w-0 p-1 overflow-hidden;
  @apply rounded bg-gray-900;
  @apply text-gray-100;

  &:hover:not(:disabled) {
    @apply bg-gray-700;
  }

  &:disabled {
    @apply text-gray-700;
  }
}

.linkName {
  @apply text-center leading-4;
  overflow: hidden;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2
}

.step {
  @apply flex items-center justify-between h-full gap-x-2 px-1 py-0.5 rounded;
  @apply text-gray-400;
}

.stepBtn {
  @apply shrink-0 rounded bg-gray-900 p-0.5 px-1.5 leading-5 rounded border;
  @apply text-gray-100;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &:hover {
    @apply bg-gray-700;
  }
}

.calcOp {
  @apply absolute top-0 h-6 flex items-center text-gray-500;
  transform: translateX(-50%);
  pointer-events: none;
}
.numInput {
  @apply w-full min-w-0 h-6 rounded bg-gray-900 text-center text-gray-100 text-lg;
  &::-webkit-inner-spin-button { display: none; }
}
.refreshBtn {
  @apply h-6 w-5 flex items-center justify-center rounded;
  @apply text-gray-600;

  &:hover:not(:disabled) {
    @apply text-gray-100 bg-gray-700;
  }

  &:disabled {
    @apply opacity-40;
  }
}
.profitBox {
  @apply w-full h-6 flex items-center justify-center rounded bg-gray-900 overflow-hidden;
}
.unitBar {
  @apply flex gap-px justify-center;
}
.unitBtn {
  @apply rounded bg-gray-900 px-1 h-6 flex items-center;
  &:hover { @apply bg-gray-700; }
}
</style>
