import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Pressable,
  Image,
  Text,
  Platform,
  ImageBackground,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';

import {
  GifSearch,
} from 'react-native-gif-search'

import { ScrollView } from 'react-native-gesture-handler';
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { setRefreshState, setVoiceState } from '../../store/actions';
import { DescriptionText } from '../component/DescriptionText';
import VoiceService from '../../services/VoiceService';
import { ShareVoice } from '../component/ShareVoice';
import Share from 'react-native-share';
import VoicePlayer from '../Home/VoicePlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SvgXml } from 'react-native-svg';
import closeBlackSvg from '../../assets/record/closeBlack.svg';
import whitePostSvg from '../../assets/record/white_post.svg';
import colorPostSvg from '../../assets/record/color_post.svg';
import gifSymbolSvg from '../../assets/common/gif_symbol.svg'
import moreSvg from '../../assets/common/more.svg';
import editSvg from '../../assets/common/edit.svg';
import blueShareSvg from '../../assets/common/blue_share.svg';
import redTrashSvg from '../../assets/common/red_trash.svg';
import starSvg from '../../assets/common/star.svg';

import { windowHeight, windowWidth, SHARE_CHECK, Avatars } from '../../config/config';
import { styles } from '../style/Common';
import { SemiBoldText } from '../component/SemiBoldText';
import { AnswerVoiceItem } from '../component/AnswerVoiceItem';
import '../../language/i18n';
import { StoryLikes } from '../component/StoryLikes';
import { TagFriends } from '../component/TagFriends';
import { TagItem } from '../component/TagItem';
import { NewChat } from '../component/NewChat';
import { AnswerRecordIcon } from '../component/AnswerRecordIcon';
import SwipeDownModal from 'react-native-swipe-down';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { DeleteConfirm } from '../component/DeleteConfirm';

const VoiceProfileScreen = (props) => {

  let recordId = props.navigation.state.params.id, answerId = props.navigation.state.params.answerId ? props.navigation.state.params.answerId : '';
  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isLike, setIsLike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [info, setInfo] = useState();
  const [showShareVoice, setShowShareVoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [allLikes, setAllLikes] = useState(false);
  const [showTagFriends, setShowTagFriends] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false)
  const [combines, setCombines] = useState([]);
  const [label, setLabel] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [friends, setFriends] = useState([]);
  const [filter, setFilter] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [forceAnswer, setForceAnswer] = useState(false);
  const [commentedUserId, setCommentedUserId] = useState('');

  const tempTagUsers = useRef([]);

  const mounted = useRef(false);

  const dispatch = useDispatch();

  const { t, i18n } = useTranslation();

  let { user, refreshState, voiceState } = useSelector((state) => {
    return (
      state.user
    )
  });

  const getUserInfo = () => {
    VoiceService.getStories(0, '', '', '', recordId).then(async res => {
      if (res.respInfo.status === 200 && mounted.current) {
        const jsonRes = await res.json();
        setIsLike(jsonRes[0].isLike);
        setLikeCount(jsonRes[0].likesCount);
        setInfo(jsonRes[0]);
      }
    })
      .catch(err => {
        console.log(err);
      });
  }

  useEffect(() => {
    if (forceAnswer == true) {
      onAnswerBio(commentedUserId);
      setForceAnswer(false);
    }
  }, [forceAnswer])

  const onCompare = (a, b) => {
    if (a.createdAt < b.createdAt)
      return 1;
    if (a.createdAt > b.createdAt)
      return -1;
    return 0;
  }

  const getAnswers = async () => {
    VoiceService.getAnswers(recordId, answerId).then(async res => {
      if (res.respInfo.status === 200 && mounted.current) {
        setLoading(false);
        const jsonRes = await res.json();
        setCombines(jsonRes);
      }
    })
      .catch(err => {
        console.log(err);
      });
  }

  const editVoice = () => {
    props.navigation.navigate("PostingVoice", { info: info });
    setShowModal(false);
  }

  const onShareAudio = () => {
    Share.open({
      url: info.file.url,
      type: 'audio/mp3',
    });
  }

  const deleteConfirm = () => {
    setShowModal(false);
    setDeleteModal(true);
  }

  const deleteVoice = () => {
    setDeleteModal(false);
    VoiceService.deleteVoice(info.id).then(async res => {
      dispatch(setRefreshState(!refreshState));
      props.navigation.navigate('Home');
    })
      .catch(err => {
        console.log(err)
      })
  }

  const setIsLiked = (index) => {
    let tp = [...combines];
    tp[index].isLiked = !tp[index].isLiked;
    if (tp[index].isLiked) tp[index].likesCount++;
    else tp[index].likesCount--;
    setCombines(tp);
  }

  const onDeleteItem = (index) => {
    let tp = [...combines];
    tp.splice(index, 1);
    tp.sort((a, b) => a.createdAt < b.createdAt);
    setCombines(tp);
  }

  const onAnswerStory = (res) => {
    res.user = user;
    let tp = combines;
    tp.unshift(res);
    tp.sort((a, b) => a.createdAt < b.createdAt);
    if (mounted.current) {
      setCombines([...tp]);
      setIsLoading(false);
    }
  }

  const onAnswerBio = (isCommented = '') => {
    setIsLoading(true);
    VoiceService.answerBio(info.id, info.user.id, { bio: label }, isCommented).then(async res => {
      if (res.respInfo.status == 200) {
        const answerBio = await res.json();
        answerBio.user = user;
        let tp = combines;
        tp.unshift(answerBio);
        tp.sort((a, b) => a.createdAt < b.createdAt);
        if (mounted.current) {
          setCombines([...tp]);
          setIsLoading(false);
        }
      }
    })
      .catch(err => {
        console.log(err);
      })
    let userIds = [];
    tempTagUsers.current.forEach(el => {
      if (label.includes('@' + el.name + ' '))
        userIds.push(el.id);
    });
    let payload = {
      storyType: 'record',
      tagUserIds: userIds,
      recordId: recordId,
    };
    VoiceService.postTag(payload).then(async res => {
    })
      .catch(err => {
        console.log(err);
      });
    tempTagUsers.current = [];
    setLabel('');
    setFilter([]);
  }

  const onAnswerGif = (gif) => {
    setShowComment(false);
    setIsLoading(true);
    VoiceService.answerGif(info.id, info.user.id, { link: gif }).then(async res => {
      if (res.respInfo.status == 200) {
        const gifAnswer = await res.json();
        gifAnswer.user = user;
        let tp = combines;
        tp.unshift(gifAnswer);
        tp.sort((a, b) => a.createdAt < b.createdAt);
        if (mounted.current) {
          setCombines([...tp]);
          setIsLoading(false);
        }
      }
    })
      .catch(err => {
        console.log(err);
      })
  }

  const getFollowUsers = () => {
    VoiceService.getFollows(user.id, "Following")
      .then(async res => {
        if (res.respInfo.status === 200 && mounted.current) {
          const jsonRes = await res.json();
          setFriends([...jsonRes]);
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  const findPosition = (e) => {
    let i;
    for (i = e.length - 1; i >= 0; i--) {
      if (e[i] == '@') break;
    }
    return i;
  }

  const onSetLabel = (e) => {
    setLabel(e);
    let i = findPosition(e);
    let tp = '';
    if (i != -1) {
      tp = e.slice(i + 1);
    }
    else
      tp = ' ';
    tp = tp.toLowerCase();
    let filterFriends = friends.filter(el => {
      let friendName = el.user.name.toLowerCase();
      return friendName.startsWith(tp)
    });
    setFilter(filterFriends);
  }

  const onReplace = (tagUser) => {
    let i = findPosition(label);
    if (i != -1) {
      setLabel(label.slice(0, i + 1).concat(tagUser.name) + ' ');
      setFilter([]);
      tempTagUsers.current.push(tagUser);
      //setCommentedUserId(id);
      //setForceAnswer(true);
    }
  }

  const onSetSpeed = () => {
    let v = 1;
    if (speed < 2)
      v = speed + 0.5;
    setSpeed(v);
  }
  useEffect(() => {
    mounted.current = true;
    getFollowUsers();
    getUserInfo();
    getAnswers();
    dispatch(setVoiceState(voiceState + 1));
    return () => {
      mounted.current = false;
    }
  }, [])

  useEffect(() => {
    mounted.current = true;
    getFollowUsers();
    getUserInfo();
    getAnswers();
    dispatch(setVoiceState(voiceState + 1));
    return () => {
      mounted.current = false;
    }
  }, [refreshState])
  return (
    <Pressable
      onPress={() => Keyboard.dismiss()}
      style={{
        flex: 1,
        backgroundColor: '#FFF'
      }}
    >
      <View
        style={{
          backgroundColor: '#FFF',
          flex: 1
        }}
      >
        <ImageBackground
          source={require('../../assets/post/PostBackground.png')}
          resizeMode="stretch"
          style={{ marginTop: -10, width: windowWidth, height: 400 }}
        >
          <View style={{ marginTop: Platform.OS == 'ios' ? 60 : 35, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
            <TouchableOpacity onPress={() => props.navigation.navigate('Home')}>
              <SvgXml width="24" height="24" xml={closeBlackSvg} />
            </TouchableOpacity>
            <SemiBoldText
              text={info?.title.toUpperCase()}
              maxWidth={windowWidth - 122}
            />
            <View style={{ height: 24, width: 24 }}>
              {info?.isMine == true && <TouchableOpacity onPress={() => setShowModal(true)}>
                <SvgXml width="24" height="24" xml={moreSvg} />
              </TouchableOpacity>}
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 22 }}>
            <TouchableOpacity
              onPress={() => {
                if (info.user.id == user.id)
                  props.navigation.navigate('Profile');
                else
                  props.navigation.navigate('UserProfile', { userId: info.user.id });
              }}
              style={{
                alignItems: 'center'
              }}
            >
              {info && <View
                style={{ paddingRight: 12 }}
              >
                {info && <Image
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderColor: '#FFA002',
                    borderWidth: (info && info.user.premium != 'none') ? 2 : 0
                  }}
                  source={info.user.avatar ? { uri: info.user.avatar.url } : Avatars[info.user.avatarNumber].uri}
                />}
                <View style={[{ position: 'absolute', left: 36, bottom: 0, width: 30, height: 30, backgroundColor: '#FFFFFF', borderRadius: 14 }, styles.contentCenter]}>
                  <Text
                    style={{
                      fontSize: 24,
                      color: 'white',
                    }}
                  >
                    {info?.emoji}
                  </Text>
                </View>
              </View>}
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: -35 }}>
                <SvgXml
                  xml={starSvg}
                  width={30}
                  height={30}
                />
                <SemiBoldText
                  text={info?.user.name}
                  fontFamily="SFProDisplay-Semibold"
                  marginLeft={0}
                  color='rgba(54, 36, 68, 0.8)'
                />
              </View>
            </TouchableOpacity>
          </View>
          {info && <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 16,
              shadowColor: 'rgba(176, 148, 235, 1)',
              backgroundColor: '#FFF',
              elevation: 10,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              borderRadius: 16,
              marginTop: 16,
              marginHorizontal: 16,
            }}
          >
            <VoicePlayer
              voiceUrl={info?.file.url}
              playBtn={true}
              waveColor={info.user.premium != 'none' ? ['#D89DF4', '#B35CF8', '#8229F4'] : ['#D89DF4', '#B35CF8', '#8229F4']}
              playing={false}
              startPlay={() => { VoiceService.listenStory(recordId, 'record') }}
              stopPlay={() => { }}
              tinWidth={(windowWidth - 120) / 200}
              mrg={windowWidth / 530}
              duration={info.duration * 1000}
              accelerator={true}
              onSetSpeed={() => onSetSpeed()}
              playSpeed={speed}
              control={true}
            />
          </View>}
        </ImageBackground>
        <View style={{ marginTop: Platform.OS == 'ios' ? -60 : -100, width: '100%', flex: 1, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 30 }}>
          <View style={{ width: '100%', marginTop: 8, alignItems: 'center' }}>
            <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: '#D4C9DE' }}>
            </View>
          </View>
          <SemiBoldText
            text={t('Answers') + ' (' + (loading ? ' ' : combines.length) + ')'}
            marginTop={19}
            marginLeft={16}
            marginBottom={15}
          />
          <ScrollView>
            {!loading ? combines.length > 0 ? combines.map((item, index) =>
              item.type ?
                <AnswerVoiceItem
                  key={index + item.id + 'answerVoice'}
                  props={props}
                  info={item}
                  onChangeIsLiked={() => setIsLiked(index)}
                  onDeleteItem={() => onDeleteItem(index)}
                  holdToAnswer={(v) => setIsHolding(v)}
                  friends={friends}
                /> :
                <TagItem
                  key={index + item.id + 'tagFriend'}
                  props={props}
                  info={item}
                  onChangeIsLiked={() => setIsLiked(index)}
                  onDeleteItem={() => onDeleteItem(index)}
                />)
              :
              <View style={{ alignItems: 'center' }}>
                <Image
                  style={{
                    width: 180,
                    height: 110
                  }}
                  source={require('../../assets/discover/no-answers.png')}
                />
                <DescriptionText
                  text={t("No answers")}
                  fontSize={17}
                  lineHeight={28}
                  color='#281E30'
                  marginTop={24}
                />
                <DescriptionText
                  text={t("Be the first one to react to this story!")}
                  fontSize={17}
                  textAlign='center'
                  maxWidth={260}
                  lineHeight={28}
                  marginTop={8}
                />
              </View>
              :
              <Progress.Circle
                indeterminate
                size={30}
                color="rgba(0, 0, 255, .7)"
                style={{ alignSelf: "center", marginTop: windowHeight / 20 }}
              />
            }
            <View style={{ width: 10, height: 58 }}></View>
          </ScrollView>
        </View>
        {info && <View style={{
          width: windowWidth,
          backgroundColor: filter.length > 0 ? '#FFF' : '#FFF0',
          elevation: filter.length > 0 ? 10 : 0,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          position: 'absolute',
          bottom: 0,
        }}>
          {filter.length > 0 && filter.map((item, index) => {
            return <TouchableOpacity style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
              key={item.user.id + index.toString()}
              onPress={() => onReplace(item.user)}
            >
              <Image
                source={item.user.avatar ? { uri: item.user.avatar.url } : Avatars[item.user.avatarNumber].uri}
                style={{ width: 24, height: 24, borderRadius: 12, marginLeft: 16 }}
                resizeMode='cover'
              />
              <View style={{
                flex: 1,
                borderBottomColor: '#F2F0F5',
                borderBottomWidth: 1,
                marginLeft: 12,
                paddingVertical: 8,
              }}>
                <SemiBoldText
                  text={'@' + item.user.name}
                  fontSize={15}
                  lineHeight={24}
                />
              </View>
            </TouchableOpacity>
          })
          }
          <View style={{
            // position: filter.length > 0 ? 'relative' : 'absolute',
            // bottom: 0,
            width: windowWidth,
            height: 80,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: '#FFF',
            elevation: filter.length > 0 ? 10 : 0,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            marginTop: 8,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 6,
              zIndex: 10,
            }}>
              <TouchableOpacity onPress={() => {
                setShowComment(!showComment);
              }}>
                <SvgXml
                  style={{
                    marginLeft: 14
                  }}
                  xml={gifSymbolSvg}
                />
              </TouchableOpacity>
              <View
                style={{
                  borderRadius: 40,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F2F0F5',
                  flex: 1,
                  height: 40,
                  marginRight: 65,
                  marginLeft: 10,
                }}
              >
                <TextInput
                  style={
                    {
                      fontSize: 15,
                      width: 205,
                      lineHeight: 18,
                      color: '#281E30',
                    }
                  }
                  value={label}
                  autoCapitalize='none'
                  onSubmitEditing={() => {
                    onAnswerBio();
                  }}
                  onChangeText={(e) => onSetLabel(e)}
                  placeholder={t("Type your answer")}
                  placeholderTextColor="rgba(59, 31, 82, 0.6)"
                />
                <TouchableOpacity disabled={label.length == 0} onPress={() => {
                  onAnswerBio();
                  Keyboard.dismiss();
                }}>
                  <SvgXml
                    xml={label == '' ? whitePostSvg : colorPostSvg}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <AnswerRecordIcon
              props={props}
              recordId={recordId}
              onPublishStory={(res) => onAnswerStory(res)}
              onStartPublish={() => setIsLoading(true)}
            />
          </View>
        </View>}
        {/* <EmojiPicker
          onEmojiSelected={(icon) => onAnswerEmoji(icon.emoji)}
          open={visibleReaction}
          onClose={() => setVisibleReaction(false)}
        /> */}
        <SwipeDownModal
          modalVisible={showComment}
          ContentModal={
            <View style={{
              position: 'absolute',
              top: 100,
              width: windowWidth,
              alignItems: 'center'
            }}>
              <View style={{
                height: 470,
                backgroundColor: '#FFF',
                shadowColor: 'rgba(88, 74, 117, 1)',
                elevation: 10,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                borderRadius: 16,
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <GifSearch
                  giphyApiKey={'lOPWZ8ORMutlKj0R1uqZV47rKbhuwrHt'}
                  onGifSelected={(gif_url) => onAnswerGif(gif_url)}
                  style={{ backgroundColor: '#FFF', height: 300, width: 400 }}
                  textInputStyle={{ fontWeight: 'bold', color: 'black' }}
                  loadingSpinnerColor={'black'}
                  placeholderTextColor='rgba(59, 31, 82, 0.6)'
                  numColumns={3}
                  provider={"giphy"}
                  //providerLogo={poweredByGiphyLogoGrey}
                  showScrollBar={false}
                  noGifsFoundText={"No Gifs found :("}
                />
              </View>
            </View>
          }
          ContentModalStyle={styles.swipeModal}
          onClose={() => {
            setShowComment(false);
          }}
        />
        {info && <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => {
            setShowModal(!showModal);
          }}
        >
          <Pressable onPressOut={() => setShowModal(false)} style={styles.swipeModal}>
            <View style={styles.swipeContainerContent}>
              <View style={[styles.rowSpaceBetween, { paddingLeft: 16, paddingRight: 14, paddingTop: 14, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: '#F0F4FC' }]}>
                <View style={styles.rowAlignItems}>
                  <Image
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19
                    }}
                    source={info.user.avatar ? { uri: info.user.avatar.url } : Avatars[info.user.avatarNumber].uri}
                  />
                  <View style={{ marginLeft: 18 }}>
                    <SemiBoldText
                      text={info?.title.toUpperCase()}
                      fontSize={17}
                      lineHeight={28}
                    />
                    <DescriptionText
                      fontSize={13}
                      lineHeight={21}
                      color={'rgba(54, 36, 68, 0.8)'}
                      text={info?.user.name}
                    />
                  </View>
                </View>
                <View style={[styles.contentCenter, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F4FC' }]}>
                  <Pressable onPress={() => setShowModal(false)}>
                    <SvgXml
                      width={18}
                      height={18}
                      xml={closeBlackSvg}
                    />
                  </Pressable>
                </View>
              </View>
              <View style={{ height: 200, borderRadius: 20, borderWidth: 1, borderColor: '#F0F4FC', marginTop: 16, marginBottom: 50, marginHorizontal: 16 }}>
                <Pressable onPress={editVoice}>
                  <View style={[styles.rowSpaceBetween, { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F4FC' }]}>
                    <DescriptionText
                      text={t("Edit")}
                      fontSize={17}
                      lineHeight={22}
                      color='#281E30'
                    />
                    <View style={[styles.contentCenter, { height: 34, width: 34, borderRadius: 17, backgroundColor: '#F8F0FF' }]}>
                      <SvgXml
                        width={20}
                        height={20}
                        xml={editSvg}
                      />
                    </View>
                  </View>
                </Pressable>
                <Pressable onPress={onShareAudio}>
                  <View style={[styles.rowSpaceBetween, { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F4FC' }]}>
                    <DescriptionText
                      text={t('Share')}
                      fontSize={17}
                      lineHeight={22}
                      color='#281E30'
                    />
                    <View style={[styles.contentCenter, { height: 34, width: 34, borderRadius: 17, backgroundColor: '#F8F0FF' }]}>
                      <SvgXml
                        width={20}
                        height={20}
                        xml={blueShareSvg}
                      />
                    </View>
                  </View>
                </Pressable>
                <Pressable onPress={deleteConfirm}>
                  <View style={[styles.rowSpaceBetween, { padding: 16 }]}>
                    <DescriptionText
                      text={t("Delete")}
                      fontSize={17}
                      lineHeight={22}
                      color='#E41717'
                    />
                    <View style={[styles.contentCenter, { height: 34, width: 34, borderRadius: 17, backgroundColor: '#FFE8E8' }]}>
                      <SvgXml
                        width={20}
                        height={20}
                        xml={redTrashSvg}
                      />
                    </View>
                  </View>
                </Pressable>
              </View>
              <View style={styles.segmentContainer}></View>
            </View>
          </Pressable>
        </Modal>}
        {deleteModal && <DeleteConfirm
          onConfirmDelete={deleteVoice}
          onCloseModal={() => setDeleteModal(false)}
        />}
        {showShareVoice &&
          <ShareVoice
            info={info}
            onCloseModal={() => setShowShareVoice(false)}
          />
        }
        {allLikes &&
          <StoryLikes
            props={props}
            storyId={info?.id}
            storyType="record"
            onCloseModal={() => setAllLikes(false)}
          />}
        {showTagFriends &&
          <TagFriends
            info={info}
            recordId={info.id}
            onCloseModal={() => setShowTagFriends(false)}
          />
        }
        {showFriendsList && <NewChat
          props={props}
          recordId={info.id}
          onCloseModal={() => setShowFriendsList(false)}
        />}
        {isLoading &&
          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(1,1,1,0.3)' }}>
            <View style={{ marginTop: windowHeight / 2.5, alignItems: 'center', width: windowWidth }}>
              <Progress.Circle
                indeterminate
                size={30}
                color="rgba(0, 0, 255, 0.7)"
                style={{ alignSelf: "center" }}
              />
            </View>
          </View>
        }
      </View>
      {Platform.OS == 'ios' && <KeyboardSpacer />}
    </Pressable>
  );
};

export default VoiceProfileScreen;