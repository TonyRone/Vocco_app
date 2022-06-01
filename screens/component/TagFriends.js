import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, Image, Platform, Share, StatusBar, Pressable, ScrollView, TextInput, Vibration } from "react-native";
import { SvgXml } from 'react-native-svg';

import { API_URL, windowWidth, windowHeight } from '../../config/config';

import * as Progress from "react-native-progress";
import { TitleText } from './TitleText';
import LinearGradient from 'react-native-linear-gradient';
import SwipeDownModal from 'react-native-swipe-down';
import { FlatList } from "react-native-gesture-handler";
import VoiceService from '../../services/VoiceService';
import Clipboard from '@react-native-community/clipboard';
import socialShare from 'react-native-share';
import { MyButton } from '../component/MyButton';
import { styles } from '../style/Common';
import closeBlackSvg from '../../assets/record/closeBlack.svg';
import searchSvg from '../../assets/login/search.svg';
import closeCircleSvg from '../../assets/common/close-circle.svg';
import copySvg from '../../assets/post/copy.svg';
import { CommenText } from "./CommenText";
import { DescriptionText } from "./DescriptionText";
import { useSelector } from 'react-redux';

import { useTranslation } from 'react-i18next';
import '../../language/i18n';
import { set } from "immer/dist/internal";

export const TagFriends = ({
  info,
  onCloseModal = () => { },
}) => {

  let { user, socketInstance } = useSelector((state) => {
    return (
      state.user
    )
  });

  const { t, i18n } = useTranslation();

  const [showModal, setShowModal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearch, setIsSearch] = useState(false);
  const [label, setLabel] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  const closeModal = () => {
    setShowModal(false);
    onCloseModal();
  }

  const onSetLabel = (v) => {
    let tp = friends.filter(item => (item.user.name.toLowerCase().indexOf(label.toLowerCase()) != -1));
    setFilterCount(tp.length);
    setLabel(v);
  }

  const getFriends = () => {
    setIsLoading(true);
    VoiceService.getFollows(user.id, "Following").then(async res => {
      if (res.respInfo.status === 200) {
        const jsonRes = await res.json();
        const userIds = jsonRes.map((item, index) => item.user.id);
        socketInstance.emit("getFriendStates", userIds, (res)=>{
          let tp = jsonRes.map((item,index)=>{
            let temp = item;
            temp.lastSeen = res[index];
            return temp;
          })
          setFriends([...tp]);
        })
        //setFriends(jsonRes);
      }
      setIsLoading(false);
    })
      .catch(err => {
        console.log(err);
      });
  }

  const onSelectFriend = (id, add = false) => {
    let tp = selectedIds;
    let idx = selectedIds.indexOf(id);
    if (idx == -1) {
      tp.push(id);
    }
    else if (add == false) {
      tp.splice(idx, 1);
    }
    setSelectedIds([...tp]);
  }

  const renderName = (fname, lname) => {
    let fullname = '';
    if (fname)
      fullname = fname;
    if (lname) {
      if (fname) fullname += '.';
      fullname += lname;
    }
    return (fullname == '' ? '' : "@") + fullname
  }

  const renderState = (lastSeen) => {
    if (lastSeen == null) {
      return t("online")
    }
    let num = Math.ceil((new Date().getTime() - new Date(lastSeen).getTime()) / 60000);
    num = Math.max(1, num);
    let minute = num % 60;
    num = (num - minute) / 60;
    let hour = num % 24;
    let day = (num - hour) / 24
    return (day > 0 ? (day.toString() + ' ' + t("day") + (day > 1 ? 's' : '')) : (hour > 0 ? (hour.toString() + ' ' + t("hour") + (hour > 1 ? 's' : '')) : (minute > 0 ? (minute.toString() + ' ' + t("minute") + (minute > 1 ? 's' : '')) : ''))) + " " + t("ago");
  }

  const handleSubmit = () => {
    let ids = selectedIds.map((item, index) => friends[item].user.id);
    let payload = {
      recordId: info.id,
      userIds: ids
    };
    setSubmitLoading(true);
    VoiceService.postTag(payload).then(async res => {
      // const jsonRes = await res.json();
      if (res.respInfo.status !== 201) {
      } else {
        Vibration.vibrate(100);
        closeModal();
      }
      setSubmitLoading(false);
    })
      .catch(err => {
        console.log(err);
      });
    closeModal();
  }

  useEffect(() => {
    getFriends();
  }, [])

  return (
    <SwipeDownModal
      modalVisible={showModal}
      ContentModal={
        <View style={styles.swipeInputContainerContent}>
          {!isSearch ?
            <>
              <View style={[styles.rowSpaceBetween, { paddingHorizontal: 14, paddingVertical: 12 }]}>
                <View></View>
                <CommenText
                  text={t("Tag friends")}
                  fontSize={17}
                  lineHeight={28}
                  color='#263449'
                />
                <TouchableOpacity onPress={() => closeModal()}>
                  <View style={[styles.contentCenter, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F4FC' }]}>
                    <SvgXml
                      width={18}
                      height={18}
                      xml={closeBlackSvg}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.paddingH16, { marginTop: 4 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <SvgXml
                    width="20"
                    height="20"
                    xml={searchSvg}
                    style={styles.searchIcon}
                  />
                  <Pressable
                    style={styles.searchBox}
                    onPress={() => setIsSearch(true)}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        color: 'grey'
                      }}
                    >{t("Enter @username")}</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ paddingHorizontal: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                {selectedIds.map((id, index) => <View key={index.toString() + "friendId" + id.toString()} style={{ flexDirection: 'row', marginLeft: 8, marginTop: 12, alignItems: 'center', height: 32, borderRadius: 16, backgroundColor: '#D4C9DE' }}>
                  <View style={{ marginLeft: 16 }}>
                    <DescriptionText
                      text={friends[id].user.name}
                      fontSize={17}
                      lineHeight={28}
                      color='#281E30'
                    />
                  </View>
                  <TouchableOpacity onPress={() => onSelectFriend(id)} style={{
                    marginLeft: 8,
                    marginRight: 4
                  }}>
                    <SvgXml
                      width={24}
                      height={24}
                      xml={closeCircleSvg}
                    />
                  </TouchableOpacity>
                </View>)}
              </View>
            </> :
            <View style={[styles.paddingH16, { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F2F0F5',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#CC9BF9',
                height: 44,
                width: windowWidth - 95,
                paddingHorizontal: 12
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <SvgXml
                    width="20"
                    height="20"
                    xml={searchSvg}
                  />
                  <TextInput
                    style={[styles.searchInput, { paddingLeft: 12, width: windowWidth - 175 }]}
                    value={label}
                    color='#281E30'
                    autoFocus={true}
                    placeholder={t("Search")}
                    onChangeText={(v) => onSetLabel(v)}
                    placeholderTextColor="rgba(59, 31, 82, 0.6)"
                  />
                </View>
                {label != '' &&
                  <TouchableOpacity
                    onPress={() => onSetLabel('')}
                  >
                    <SvgXml
                      width="30"
                      height="30"
                      xml={closeCircleSvg}
                    />
                  </TouchableOpacity>}
              </View>
              <TouchableOpacity onPress={() => { setIsSearch(false); onSetLabel('') }}>
                <TitleText
                  text={t('Cancel')}
                  fontSize={17}
                  fontFamily='SFProDisplay-Regular'
                  color='#8327D8'
                />
              </TouchableOpacity>
            </View>
          }
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: (!isSearch && selectedIds.length > 0) ? 100 : 0, flex: 1 }}>
            {(filterCount == 0 && isLoading == false && label != '') ?
              <View style={{ marginTop: windowHeight / 7, alignItems: 'center', width: windowWidth }}>
                <Image
                  style={{
                    width: 135,
                    height: 135,
                  }}
                  source={require("../../assets/common/memojiGirl.png")}
                />
                <DescriptionText
                  text={t("No users found")}
                  fontSize={17}
                  lineHeight={28}
                  marginTop={23}
                  color="#281E30"
                />
                <DescriptionText
                  text={t("Try check spelling or enter")}
                  fontSize={17}
                  lineHeight={28}
                  marginTop={8}
                  color="rgba(54, 36, 68, 0.8)"
                />
                <DescriptionText
                  text={t("another request")}
                  fontSize={17}
                  lineHeight={28}
                  color="rgba(54, 36, 68, 0.8)"
                />
              </View> :
              <FlatList
                data={friends}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => <>
                  {(label == '' && (index == 0 || item.user.name.toLowerCase().charAt(0) != friends[index - 1].user.name.toLowerCase().charAt(0))) &&
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: 44
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "SFProDisplay-Semibold",
                          fontSize: 20,
                          lineHeight: 24,
                          color: '#281E30'
                        }}
                      >
                        {item.user.name.toUpperCase().charAt(0)}
                      </Text>
                    </View>
                  }
                  {(item.user.name.toLowerCase().indexOf(label.toLowerCase()) != -1) &&
                    <TouchableOpacity
                      onPress={() => {
                        onSelectFriend(index, true);
                        onSetLabel('');
                        setIsSearch(false);
                      }}
                      key={index + item.user.id + "friends"}
                      style={{ flexDirection: 'row', alignItems: 'center', marginLeft: isSearch ? 0 : 16, marginTop: 10, marginBottom: 10 }}
                    >
                      <Image
                        source={{ uri: item.user.avatar.url }}
                        style={{ width: 48, height: 48, borderRadius: 24, borderColor: '#FFA002', borderWidth: item.user.premium == 'none' ? 0 : 2 }}
                        resizeMode='cover'
                      />
                      <View style={{
                        marginLeft: 16
                      }}>
                        <TitleText
                          text={item.user.name}
                          fontSize={15}
                          lineHeight={24}
                          color='#281E30'
                        />
                        <DescriptionText
                          text={label == '' ? renderState(item.lastSeen) : renderName(item.user.firstname, item.user.lastname)}
                          fontSize={13}
                          lineHeight={21}
                          color={(label == '' && item.lastSeen == null) ? '#8327D8' : 'rgba(54, 36, 68, 0.8)'}
                        />
                      </View>
                    </TouchableOpacity>}
                </>
                }
              />
            }
          </View>
          {(!isSearch && selectedIds.length > 0) && <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255, 0)']}
            locations={[0.7, 1]}
            start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
            style={{ position: 'absolute', paddingHorizontal: 16, bottom: 0, width: windowWidth }}
          >
            <MyButton
              label={"Tag " + selectedIds.length + " " + t("friend") + (selectedIds.length > 1 ? 's' : '')}
              //marginTop={90}
              onPress={handleSubmit}
              loading={submitLoading}
              active={true}
              marginBottom={40}
            />
          </LinearGradient>}
          {isLoading && <View style={{ position: 'absolute', width: '100%', top: windowHeight / 2.8 }}>
            <Progress.Circle
              indeterminate
              size={30}
              color="rgba(0, 0, 255, .7)"
              style={{ alignSelf: "center" }}
            />
          </View>}
        </View>
      }
      ContentModalStyle={styles.swipeModal}
      onRequestClose={() => closeModal()}
      onClose={() => {
        closeModal();
      }}
    />
  );
};
