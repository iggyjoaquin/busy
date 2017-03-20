import Vue from 'vue';
import config from '../../../config.js';
import draggable from 'vuedraggable';
import lodash from 'lodash';
import authService from 'src/app/services/auth';
let firebase = require('firebase');
let app = firebase.initializeApp(config.firebase);

export default {

  data() {
      return {
        user: {},
        userId: localStorage.getItem("id_token"),
        maxDaily: 9,
        maxWeekly: 9,
        dailyId: 1,
        weeklyId: 1,
        currentUserId: null,
        newDailyTodo: "",
        newWeeklyTodo: "",
        editingDailyTodo: "",
        editingDailyTodoObject: {},
        editingWeeklyTodo: "",
        editingWeeklyTodoObject: {},
        dailyList: [],
        weeklyList: [],
        dailyListCompleted : [],
        weeklyListCompleted : [],
        bannerStyles: [
            {backgroundColor: "#6F83BA"}, //indigo
            {backgroundColor: "#BBDEFB"}, //baby blue
            {backgroundColor: "#D14E5D"}, //red
            {backgroundColor: "#FFD54F"}, //amber
        ]
      }
  },

  mounted(){
    this.bannerStyles = this.shuffleArray(this.bannerStyles);
    const vueInstance = this;

    let c = function() {
        let u = localStorage.getItem("id_token");
        this.userId = u;

        if (u != null) {
           firebase.database().ref('users/' + u).once('value').then((snapshot) => {
               vueInstance.user = snapshot.val();

               if (snapshot.val().dailyList) {
                   // set daily lists
                   if (snapshot.val().dailyList.list) {
                       vueInstance.dailyList = snapshot.val().dailyList.list;
                       vueInstance.dailyId = snapshot.val().dailyList.list.length;
                   }

                   if (snapshot.val().dailyList.completed)
                    vueInstance.dailyListCompleted = snapshot.val().dailyList.completed.completedList;
               }

               if (snapshot.val().weeklyList) {
                   // set weekly lists
                   if (snapshot.val().weeklyList.list) {
                        vueInstance.weeklyList = snapshot.val().weeklyList.list;
                        vueInstance.weeklyId = snapshot.val().weeklyList.list.length;
                   }

                   if (snapshot.val().weeklyList.completed)
                    vueInstance.weeklyListCompleted = snapshot.val().weeklyList.completed.completedList;
              }


           });
           return;
        }
    }
    setTimeout(c, 1000);
  },

  components: {
    draggable,
    VLayout: require('layouts/default/default.vue'),
    VPanel: require('components/panel/panel.vue'),
  },

  methods:{
      shuffleArray(arr){
          let i, j, k;
          for (i = arr.length; i; i--) {
              j = Math.floor(Math.random() * i);
              k = arr[i - 1];
              arr[i - 1] = arr[j];
              arr[j] = k;
          }
          return arr;
      },

      addDailyTodo(){
          if (this.newDailyTodo.trim().length > 140) {
              this.notifyError("Keep it under 140 characters.");
              return;
          }

          if (this.dailyList.length < this.maxDaily) {
              let val = this.newDailyTodo && this.newDailyTodo.trim()
              if (!val) {
                return;
              }

              let id = this.dailyId;
              this.dailyList.push({ item: this.newDailyTodo });
              this.newDailyTodo = "";
              this.dailyId++;

              //reset edits
              this.editingDailyTodoObject = {};

              this.saveDailyItems();
          } else {
            //Show toastr
          }
      },

      addWeeklyTodo(){
          if (this.newWeeklyTodo.trim().length > 140) {
              this.notifyError("Keep it under 140 characters.");
              return;
          }

          if (this.weeklyList.length < this.maxWeekly) {
              let val = this.newWeeklyTodo && this.newWeeklyTodo.trim()
              if (!val) {
                return;
              }

              let id = this.weeklyId;
              this.weeklyList.push({item: this.newWeeklyTodo});
              this.newWeeklyTodo = "";
              this.weeklyId++;
              this.saveWeeklyItems();
         } else {
            //Show toastr

         }
      },

      markDailyItemCompleted(item){
          let index = this.dailyList.indexOf(item);
          if (index > -1) {
            this.dailyList.splice(index,1);
          }
          this.dailyListCompleted.push(item)
          this.saveDailyItems();
      },

      markWeeklyItemCompleted(item){
          let index = this.weeklyList.indexOf(item);
          if (index > -1){
            this.weeklyList.splice(index,1);
          }
          this.weeklyListCompleted.push(item)
          this.saveWeeklyItems();
      },


      removeDailyItem(item) {
          let index = this.dailyList.indexOf(item);
          if (index > -1) {
            this.dailyList.splice(index,1);
          }
          this.saveDailyItems();
      },

      removeWeeklyItem(item) {
          let index = this.weeklyList.indexOf(item);
          if (index > -1){
            this.weeklyList.splice(index,1);
          }
          this.saveWeeklyItems();
      },

      saveDailyItems(){
          let id = this.userId;
          let list = this.dailyList;
          let completedList = this.dailyListCompleted;

          if (this.currentUserId == null){
              this.currentUserId = id;
          }

          //save current daily list
          firebase.database().ref('users/' + id + '/dailyList/').set({list}).then(() => {
              console.log("Daily list saved");
              // save currently daily completed list
              firebase.database().ref('users/' + id + '/dailyList/completed/').set({completedList}).then(() =>{
                  console.log("Daily completed list saved");
              });
          });
      },

      saveWeeklyItems(){
          let id = this.userId;
          let list = this.weeklyList;
          let completedList = this.weeklyListCompleted;

          if (this.currentUserId == null){
              this.currentUserId = id;
          }

          //save current weekly list
          firebase.database().ref('users/' + id + '/weeklyList/').set({list}).then(() =>{
              console.log("Weekly list saved");
              // save currently weekly completed list
              firebase.database().ref('users/' + id + '/weeklyList/completed/').set({completedList}).then(() =>{
                  console.log("Weekly completed list saved");
              });
          });
      },

      editDailyItem(item){
          this.editingDailyTodoObject = item;
          this.editingDailyTodo = item.item;
      },

      addDailyEditedItem() {
        if (this.editingDailyTodo.trim().length > 140) {
            this.notifyError("Keep it under 140 characters.");
            return;
        }

        if (this.editingDailyTodo.trim().length === 0) {
            this.editingDailyTodo = "";
            this.editingDailyTodoObject = {};
            return;
        }

        let oldIdx = this.dailyList.indexOf(this.editingDailyTodoObject);
        this.dailyList[oldIdx].item = this.editingDailyTodo;
        this.editingDailyTodo = "";
        this.editingDailyTodoObject = {};
        this.saveDailyItems();
      },


      editWeeklyItem(item){
          this.editingWeeklyTodoObject = item;
          this.editingWeeklyTodo = item.item;
      },

      addWeeklyEditedItem() {
        if (this.editingWeeklyTodo.trim().length > 140) {
            this.notifyError("Keep it under 140 characters.");
            return;
        }

        if (this.editingWeeklyTodo.trim().length === 0) {
            this.editingWeeklyTodo = "";
            this.editingWeeklyTodoObject = {};
            return;
        }

        let oldIdx = this.weeklyList.indexOf(this.editingWeeklyTodoObject);
        this.weeklyList[oldIdx].item = this.editingWeeklyTodo;
        this.editingWeeklyTodo = "";
        this.editingWeeklyTodoObject = {};
        this.saveWeeklyItems();
      },

      clearCompleted(list) {
          if (!list){
            //0: Daily
            this.dailyListCompleted = [];
            this.saveDailyItems();
          } else {
            //1: Weekly
            this.weeklyListCompleted = [];
            this.saveWeeklyItems();
          }
      },

      moveDailyCompleted() {
         for (let i=0; i<this.dailyListCompleted.length; i++) {
             this.weeklyListCompleted.push(this.dailyListCompleted[i]);
         }

         this.dailyListCompleted = [];
         this.saveDailyItems();
         this.saveWeeklyItems();
      },

      random(min, max){
          return _.random(min, max);
      },

      notifyError(msg) {
          $(".notify-error").hide();
          $('<div/>').prependTo('body').addClass('notify-error').html(msg).slideDown();
          setTimeout(this.slideUpError, 2000);
      },

      resetEditingDaily() {
          this.editingDailyTodo = "";
          this.editingDailyTodoObject = {};
      },

      resetEditingWeekly() {
          this.editingWeeklyTodo = "";
          this.editingWeeklyTodoObject = {};
      },

      slideUpError(){
          $(".notify-error").slideUp();
      }

  }
};
