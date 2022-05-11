import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../style/Common';
import { AudioContext, OfflineAudioContext } from 'standardized-audio-context';
import Draggable from 'react-native-draggable';
import React, {Component} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import AudioSpectrum from 'react-audio-spectrum'
import { SvgXml } from 'react-native-svg';
import RNFetchBlob from 'rn-fetch-blob'; 
import { setVoiceState } from '../../store/actions';
import { connect } from 'react-redux';
import { bindActionCreators } from '@reduxjs/toolkit';
import { windowHeight, windowWidth } from '../../config/config';
import { TouchableHighlightBase } from 'react-native';
import ThemedListItem from 'react-native-elements/dist/list/ListItem';

import pauseSvg from '../../assets/common/pause.svg';
import playSvg from '../../assets/common/play.svg';
import replaySvg from '../../assets/common/replay.svg';

const screenWidth = Dimensions.get('screen').width;

class VoicePlayer extends Component {
  
  dirs = RNFetchBlob.fs.dirs;
  path = Platform.select({
    ios: 'hello.m4a',
    android: `${this.dirs.CacheDir}/hello.mp3`,
  });
  
  _isMounted = false;
  _playerPath = this.path;
  waveHeight = 40;
  waveheights = [7,12,2,1,8,3,13,9,12,10,31,24,29,8,32,38,18,19,28,7,19,13,17,10,14,1,28,10,31,2,30,3,3,23,30,3,39,35,21,38,32,5,12,19,13,13,10,10,33,18,37,33,9,32,30,13,8,24,18,4,21,9,16,8,18,20,28,16,23,11,16,15,11,29,4,35,37,23,15,28]
  constructor(props) {
    super(props);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this.changePlayStatus = this.changePlayStatus.bind(this);
    this.onReplay = this.onReplay.bind(this);
    this.getPlayLink = this.getPlayLink.bind(this);
    this.state = {
      isLoggingIn: false,
      recordSecs: 0,
      recordTime: '00:00:00',
      currentPositionSec: 0,
      currentDurationSec: 0,
      playTime: '00:00:00',
      duration: '00:00:00',
      isPlaying:false,
      isStarted:false,
      swipe:{}
    };
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.5); // optional. Default is 0.5
  }
  
  componentDidMount (){
    this._isMounted = true;
    const fileRemoteUrl = this.props.voiceUrl;
    if(fileRemoteUrl==null){
      this._playerPath = this.path;
      if(this.props.playing==true) {
        this.onStartPlay()
      }
    }
    else{
      this.getPlayLink().then(()=>{
        if(this.props.playing==true) {
          this.onStartPlay()
        }
      })
    }
  }
  componentDidUpdate(prevProps){
    if(prevProps.voiceState == true && this.state.isStarted==true && this.props.voiceState == false){
      this.onStopPlay();
    }
  }
  // runSpectrum(){
  //   const bufferLength = this.state.audioData.frequencyBinCount;
  //   const amplitudeArray = new Uint8Array(bufferLength);
  //   this.state.audioData.getByteFrequencyData(amplitudeArray)
  //   console.log(amplitudeArray.length+"  lenlen");
  //   this.setState({spectrumArray:amplitudeArray})
  //   requestAnimationFrame(this.runSpectrum)
  // }
    
  componentWillUnmount(){
    this.onStopPlay();
    this._isMounted = false;
  }
  _onTouchStart=(e)=> {
    if(this.state.isPlaying){
   //   const touch = e.touches[0];
      this.setState({swipe:{ x: e.nativeEvent.pageX }})
     // this.onPausePlay();
    }
  }

  _onTouchEnd=(e)=> {
    if(this.state.swipe.x){
    //  const touch = e.changedTouches[0];
      const absX = e.nativeEvent.pageX - this.state.swipe.x;
      let positionSec = this.state.currentPositionSec;
      positionSec += this.state.currentDurationSec * absX / windowWidth ;
      if(positionSec<0)positionSec = 0;
      if(positionSec>this.state.currentDurationSec) positionSec = this.state.currentDurationSec;
      this.audioRecorderPlayer.seekToPlayer(positionSec);
    //  this.onResumePlay();
      this.setState({swipe : {}});
    }
  }

  getPlayLink= async()=>{
    const fileRemoteUrl = this.props.voiceUrl;
    const fileExtension = Platform.select({
      ios: 'm4a',
      android: `mp3`,
    });
    const dirs = RNFetchBlob.fs.dirs.CacheDir;
    const path = Platform.select({
      ios: `${dirs}/ss.m4a`,
      android: `${dirs}/ss.mp3`,
    });
    await RNFetchBlob.config({
      fileCache: false,
      appendExt: fileExtension,
      path,
    }).fetch('GET', fileRemoteUrl).then(res=>{
      if(this._isMounted&&res.respInfo.status==200){
        this._playerPath = `${Platform.OS === 'android' ? res.path() : 'ss.m4a'}`;
        return 0 ;
      }
    }).catch(err=>{
      console.log(err);
      this.onStopPlay();
    })
  }

  changePlayStatus=()=>{
    if(this.state.isPlaying)
      this.onPausePlay();
    else if(this.state.isStarted)
      this.onResumePlay();
    else{
      this.getPlayLink().then(()=>{
        this.onStartPlay();
      })
    }
  }

  onReplay=()=>{
    if(this.state.isPlaying)
      this.audioRecorderPlayer.seekToPlayer(0);
    else if(this.state.isStarted){
      this.audioRecorderPlayer.seekToPlayer(0);
      this.onResumePlay();
    }
    else{
      this.getPlayLink().then(()=>{
        this.onStartPlay();
      })
    }
  }

  render() {
    let waveCom = [];
    let waveWidth = this.props.tinWidth?this.props.tinWidth:1.5;
    let mrg = this.props.mrg?this.props.mrg:0.4;
    this.waveHeight = this.props.height?this.props.height:39;
    for(let i = 0 ; i < 80 ; i++) {
      let h;
      if(this.state.isPlaying) h = Math.floor(Math.random() * this.waveHeight) + 1;
      else h = this.waveheights[i]*this.waveHeight/39.0;
      waveCom.push(
        <LinearGradient
          colors={this.props.premium==true?['#FFC701','#FF8B02']:['#D89DF4', '#B35CF8','#8229F4']}
          locations={this.props.premium==true?[0,1]:[0,0.52,1]}
          start={{x: 0, y: 0}} end={{x: 0, y: 1}}
          key={i}
          style={{
            width:waveWidth,
            height: h,
            borderRadius:4,
            marginRight:mrg,
            marginLeft:mrg
          }}
        >
        </LinearGradient>
      );
    }
    return (
      <View
        style={styles.rowSpaceAround}
      >
        {this.props.playBtn&&<TouchableOpacity onPress={()=>this.changePlayStatus()}>
          <SvgXml
            width={windowWidth/10}
            height={windowWidth/10}
            xml={this.state.isPlaying ? pauseSvg:playSvg}
          />
        </TouchableOpacity>}
        <View
          style = {{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height:this.waveHeight+1,
          }}
          onTouchStart={this._onTouchStart}
          onTouchEnd={this._onTouchEnd}
        > 
          {waveCom}
        </View>
        {this.props.replayBtn&&
        <TouchableOpacity onPress={()=>this.onReplay()}>
          <SvgXml
            width={windowWidth/10}
            height={windowWidth/10}
            xml={replaySvg}
          />
        </TouchableOpacity>}
        {this.props.rPlayBtn&&<TouchableOpacity onPress={()=>this.changePlayStatus()} style = {{marginLeft:10}}>
          <SvgXml
            width={40}
            height={40}
            xml={this.state.isPlaying ? pauseSvg:playSvg}
          />
        </TouchableOpacity>}
      </View>
      
    );
  }

  onStatusPress = (e) => {
    const touchX = e.nativeEvent.locationX;
    const playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);
    const currentPosition = Math.round(this.state.currentPositionSec);

    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + 1000);
      this.audioRecorderPlayer.seekToPlayer(addSecs);
    } else {
      const subSecs = Math.round(currentPosition - 1000);
      this.audioRecorderPlayer.seekToPlayer(subSecs);
    }
  };
  
  onStartPlay = async () => {
    //? Custom path
    let { voiceState, actions } = this.props;
    if(voiceState == true){
      actions.setVoiceState(false);
    }
    try
    {
      const msg = await this.audioRecorderPlayer.startPlayer(this._playerPath);
      const volume = await this.audioRecorderPlayer.setVolume(1.0);
      actions.setVoiceState(true);
      this.setState({
        isStarted:true,
        isPlaying:true
      });
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if(this._isMounted){
          if(this.state.isPlaying)
            this.setState({
              currentPositionSec: e.currentPosition,
              currentDurationSec: e.duration,
            });
          if(e.currentPosition==e.duration){
            this.onStopPlay();
          }
        }
        else{
          this.audioRecorderPlayer.stopPlayer();
          this.audioRecorderPlayer.removePlayBackListener();
        } 
      });
    }
    catch(err){
      this.onStopPlay();
    }
  };

  onPausePlay = async () => {
    let { actions } = this.props;
    actions.setVoiceState(false);
    await this.audioRecorderPlayer.pausePlayer();
    this.setState({
      isPlaying:false
    })
  };

  onResumePlay = async () => {
    let { actions } = this.props;
    actions.setVoiceState(true);
    await this.audioRecorderPlayer.resumePlayer();
    this.setState({
      isPlaying:true
    })
  };

  onStopPlay = async () => {
    let { actions } = this.props;
    actions.setVoiceState(false);
    this.setState({isPlaying:false,isStarted:false});
    await this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
    this.props.stopPlay();
  };
}

const mapStateToProps = state => ({
  voiceState: state.user.voiceState,
});

const ActionCreators = Object.assign(
  {},
  {setVoiceState},
);
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(ActionCreators, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(VoicePlayer)