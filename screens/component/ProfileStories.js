import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { setRefreshState } from '../../store/actions';
import '../../language/i18n';
import * as Progress from "react-native-progress";
import { ProfileStoryItem } from './ProfileStoryItem';
import { SvgXml } from 'react-native-svg';
import box_blankSvg from '../../assets/discover/box_blank.svg';
import { windowHeight, windowWidth } from '../../config/config';
import { useSelector, useDispatch } from 'react-redux';
import VoiceService from '../../services/VoiceService';
import { DescriptionText } from './DescriptionText';
import { MyButton } from './MyButton';
import { InviteUsers } from './InviteUsers';
import SelectTopicScreen from '../PhoneNumberLogin/SelectTopicScreen';
import { styles } from '../style/Common';
import whiteTrashSvg from '../../assets/notification/white_trash.svg'

export const ProfileStories = ({
  props,
  loadKey = 0,
  screenName = '',
  category = '',
  userId = '',
  searchTitle = '',
  recordId = '',
}) => {

  const dispatch = useDispatch();

  const { t, i18n } = useTranslation();
  const scrollRef = useRef();
  const mounted = useRef(false);

  const [stories, setStories] = useState([]);
  const [LoadMore, setLoadMore] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showEnd, setShowEnd] = useState(false);
  const [showInviteList, setShowInviteList] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  let { refreshState } = useSelector((state) => {
    return (
      state.user
    )
  });

  const OnShowEnd = () => {
    if (showEnd) return;
    setShowEnd(true);
    setTimeout(() => {
      if (mounted.current)
        setShowEnd(false);
    }, 2000);
  }

  const getStories = (isNew) => {
    setLocalKey(loadKey);
    if (!isNew && LoadMore < 10) {
      OnShowEnd();
      return;
    }
    if (isNew) setLoading(true);
    VoiceService.getStories(isNew ? 0 : stories.length, userId, category, searchTitle, recordId, screenName == 'Feed' ? 'friend' : '').then(async res => {
      if (res.respInfo.status === 200 && mounted.current) {
        const jsonRes = await res.json();
        setStories((stories.length == 0 || isNew) ? [...jsonRes] : [...stories, ...jsonRes]);
        setLoadMore(jsonRes.length);
        setLoading(false);
        if (isNew)
          scrollRef.current?.scrollToOffset({ animated: true, offset: 0 });
      }
    })
      .catch(err => {
        console.log(err);
      });
  }

  const onChangeLike = (id, val) => {
    let tp = [...stories];
    let item = tp[id].isLike;
    if (item == true && val == false) {
      tp[id].likesCount--;
    }
    else if (item == false && val == true) {
      tp[id].likesCount++;
    }
    tp[id].isLike = val;
    setStories(tp);
  }

  const deleteVoice = (id) => {
    VoiceService.deleteVoice(id).then(async res => {
      dispatch(setRefreshState(!refreshState));
    })
      .catch(err => {
        console.log(err)
      })
  }

  const storyItems = useMemo(() => {
    return stories.map((item, index) => {
      return <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ maxWidth: windowWidth }}>
        <ProfileStoryItem
          key={index + item.id + screenName}
          props={props}
          info={item}
          onChangeLike={(isLiked) => onChangeLike(index, isLiked)}
        />
        <TouchableOpacity
          style={[styles.rowAlignItems, {
            marginTop: 12,
            marginBottom: 4,
            width: windowWidth,
            paddingVertical: 24,
            paddingHorizontal: 16,
            backgroundColor: '#E41717',
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24
          }]}
          onPress={() => deleteVoice(item.id)}
        >
          <View style={{ width: 2, height: 16, marginLeft: 4, backgroundColor: '#B91313', borderRadius: 1 }}></View>
          <SvgXml
            marginLeft={10}
            xml={whiteTrashSvg}
          />
          <DescriptionText
            text={t("Delete")}
            fontSize={17}
            lineHeight={22}
            color='white'
            marginLeft={16}
          />
        </TouchableOpacity>
      </ScrollView>
    }
    )
  }, [stories, refreshState])

  useEffect(() => {
    mounted.current = true;
    getStories(loadKey <= localKey);
    return () => {
      mounted.current = false;
    }
  }, [refreshState, loadKey, category])

  return <View>
    {showEnd &&
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <Image
          style={{
            width: 20,
            height: 20
          }}
          source={require('../../assets/common/happy.png')}
        />
        <DescriptionText
          marginLeft={3}
          text={t("You are up to date 🎉! Share Vocco with your friends!")}
        />
      </View>
    }
    {(stories.length > 0 ? storyItems :(!loading?
      (screenName == 'Feed' ?
        <View style={{ width: windowWidth, alignItems: 'center' }}>
          <Image
            style={{
              width: 343,
              height: 321
            }}
            source={require('../../assets/Feed/InviteFriend.png')}
          />
          <Text
            numberOfLines={2}
            style={{
              fontFamily: "SFProDisplay-Semibold",
              fontSize: 20,
              lineHeight: 32,
              width: 280,
              color: "rgba(54, 36, 68, 0.8)",
              textAlign: 'center',
            }}
          >
            {t("Invite your friends and connect with other people!")}
          </Text>
          <MyButton
            label={t("Invite friends")}
            onPress={() => setShowInviteList(true)}
          />
        </View> :
        <View style={{ marginTop: windowHeight / 20, alignItems: 'center', width: windowWidth }}>
          <SvgXml
            xml={box_blankSvg}
          />
          <DescriptionText
            text={t("No stories yet")}
            fontSize={17}
            lineHeight={28}
            marginTop={22}
          />
        </View>
      )
      :null)
    )}
    {loading &&
      <View style={{
        position: stories.length?'absolute':'relative',
        width:'100%',
        alignItems: 'center',
        marginTop:100,
        elevation: 20
      }}>
        <Progress.Circle
          indeterminate
          size={30}
          color="rgba(0, 0, 255, .7)"
          style={{ alignSelf: "center" }}
        />
      </View>
    }
    {showInviteList &&
      <InviteUsers
        props={props}
        onCloseModal={() => setShowInviteList(false)}
      />
    }
  </View>
};
