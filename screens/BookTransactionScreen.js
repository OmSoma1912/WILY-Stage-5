import React from 'react';
import {ToastAndroid, Text, View, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class BookTransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedBookID: '',
      scannedStudentID: '',
      buttonState: 'normal',
      transactionMessage : ''
    }
  }

  getCameraPermissions = async()=>{
    const {status} = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      hasCameraPermissions : status === "granted",
      buttonState : 'id',
      scanned : false
    });
  }

  handleBarCodeScanned = async({type, data})=>{
    const{buttonState} = this.state
    
    if(buttonState === "BookId"){
      this.setState({
        scanned : true,
        scannedBookID : data,
        buttonState : 'normal'
      });
    }
    else if(buttonState === "StudentId"){
      this.setState({
        scanned : true,
        scannedStudentID : data,
        buttonState : 'normal'
      });
    }
  }

  initiateBookIssue = async()=>{
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })
    
    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability' : false  
    })

    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentID).update({
      "numberofBooksIssued" : firebase.firestore.FieldValue.increment(1) 
    })

    this.setState({
      scannedStudentID : '',
      scannedBookID : ''
    })
  }

  initiateBookReturn = async()=>{
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Return"
    })
    
    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability' : true  
    })

    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentID).update({
      "numberofBooksIssued" : firebase.firestore.FieldValue.increment(-1) 
    })

    this.setState({
      scannedStudentID : '',
      scannedBookID : ''
    })
  }

  handleTransaction = async()=>{
    var transactionMessage = null;
    db.collection("books").doc(this.state.scannedBookID).get()
    .then((doc)=>{
      var book = doc.data()
      if(book.bookAvailability){
        this.initiateBookIssue();
        transactionMessage = "Book Issued"
        ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
      }
      else{
        this.initiateBookReturn();
        transactionMessage = "Book Returned"
        ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
      }
    })

    this.setState({
      transactionMessage : transactionMessage
    })
  }

  render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if(buttonState !== "normal" && hasCameraPermissions){
      return(
        <BarCodeScanner
        onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
        style = {StyleSheet.absoluteFillObject}
        />
      );
    }

    else if(buttonState === "normal"){
      return(
        <KeyboardAvoidingView style = {styles.container} behavior = "padding" enabled>
          <View>
            <Image
              source = {require("../assets/booklogo.jpg")}
              style = {{width : 200, height : 200}}
            />
            <Text style = {{textAlign : 'center', fontsize : 30}}>Wily</Text>
          </View>
          <View style = {styles.inputView}>
            <TextInput
              style = {styles.inputBox}
              placeHolder = "Book Id"
              onChangeText = {text=>this.setState({scannedBookID : text})}
              value = {this.state.scannedBookID}
            />
            <TouchableOpacity
              style = {styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
                <Text style = {styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <View style = {styles.inputView}>
            <TextInput
              style = {styles.inputBox}
              placeHolder = "Student Id"
              onChangeText = {text=>this.setState({scannedStudentID : text})}
              value = {this.state.scannedStudentID}
            />
            <TouchableOpacity
              style = {styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
                <Text style = {styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
          style = {styles.submitButton}
          onPress={async()=>{
            var transactionMessage = this.handleTransaction();
            this.setState({
              scannedBookID : '',
              scannedStudentID : ''
            })
          }}>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container : {
    flex : 1,
    justifyContent : 'center',
    alignItems : 'center'
  },
  displayText : {
    fontSize : 15,
    textDecorationLine : 'underline'
  },
  scanButton : {
    backgroundColor : '#2196f3',
    padding : 10,
    margin : 10
  },
  buttonText : {
    fontSize : 20,
  },
  inputView:{
    flexDirection: 'row',
    margin: 20
  },
  inputBox:{
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton:{
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  }
});