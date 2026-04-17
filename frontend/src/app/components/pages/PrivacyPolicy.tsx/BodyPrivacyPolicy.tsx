"use client"
import React, { FunctionComponent, useEffect, useState } from "react";

import "./styles/bodyPrivacyPolicy.css";
import { useLanguage } from "../../../context/LanguageContext";


const BodyPrivacyPolicy:FunctionComponent = () => {

  const { language } = useLanguage();

  const [textSize, setTextSize] = useState<string>("text-xl");


  class TranslateClass {
    static header() {
        if(language == "german") return "Vertraulichkeitspolitik"
        if(language == "russian") return "Политика кондифенциальности"
    }

    static content() {
       if(language == "german") return (
       <div className="content" style={{maxWidth: window.innerWidth}}>
        <pre> 1. Allgemeine Bestimmungen Diese Datenschutzrichtlinie regelt die Verarbeitung und den Schutz personenbezogener Daten der Benutzer, die unsere Nachhilfe-Website (nachfolgend „Website“ genannt) besuchen. Wir verpflichten uns, die Sicherheit Ihrer Daten zu gewährleisten und die geltenden Datenschutzgesetze einzuhalten.</pre><br/>
        <pre>2. Welche Daten erheben wir? Wir können die folgenden Daten erheben und verarbeiten: Name, Kontaktdaten (Telefonnummer, E-Mail-Adresse); Daten, die bei der Registrierung oder beim Ausfüllen von Formularen auf der Site bereitgestellt werden; Informationen über Besuche auf der Site, einschließlich IP-Adresse, Browsertyp, Sprache, Uhrzeit des Besuchs und angezeigte Seiten; Informationen zum Lernprozess, einschließlich Feedback und Kommunikation mit Lehrern.</pre><br/>
        <pre>3. So verwenden wir Ihre Daten Ihre personenbezogenen Daten werden für folgende Zwecke verwendet: Sicherstellung des Betriebs der Website und Bereitstellung von Bildungsdiensten; Kontaktaufnahme mit Benutzern bezüglich Schulung, Beratung und technischem Support; Verbesserung der Servicequalität und Personalisierung der Interaktion mit Benutzern; Gewährleistung der Sicherheit und Betrugsprävention; Senden von Benachrichtigungen, Neuigkeiten und Angeboten (sofern Sie dem Erhalt dieser zugestimmt haben).</pre><br/>
        <pre>4. Weitergabe und Speicherung von Daten Wir geben Ihre personenbezogenen Daten ohne Ihre Einwilligung nicht an Dritte weiter, außer in gesetzlich vorgesehenen Fällen. Die Daten werden auf sicheren Servern gespeichert und nur für die in dieser Richtlinie angegebenen Zwecke verwendet.</pre><br/>
        <pre>5. Schutz personenbezogener Daten Wir ergreifen alle notwendigen Maßnahmen, um personenbezogene Daten vor unberechtigtem Zugriff, Veränderung, Weitergabe oder Zerstörung zu schützen. Der Zugriff auf Informationen ist ausschließlich autorisierten Mitarbeitern gestattet.</pre><br/>
        <pre>6. Ihre Rechte Sie haben das Recht: Auskunft darüber zu verlangen, welche Daten über Sie gespeichert sind; Auf Wunsch Änderungen oder Löschung Ihrer Daten vornehmen; Den Erhalt von Marketing-Mitteilungen ablehnen; Wenn Sie der Meinung sind, dass die Verarbeitung Ihrer Daten gegen geltendes Recht verstößt, können Sie sich bei der Aufsichtsbehörde beschweren.</pre><br/>
        <pre>7. Änderungen der Datenschutzrichtlinie Wir können Änderungen an dieser Datenschutzrichtlinie vornehmen. Die aktualisierte Version wird auf der Site unter Angabe des Datums der letzten Aktualisierung veröffentlicht.</pre><br/>
        <pre>8. Kontaktdaten Wenn Sie Fragen zur Verarbeitung personenbezogener Daten haben, wenden Sie sich bitte per E-Mail an uns: </pre><a className="font-bold">ra.ivanov1405@gmail.com</a><br/>
       </div>
       )
       if(language == "russian") return (
        <div className="content" style={{maxWidth: window.innerWidth}}>
        <pre>
        1. Общие положения
Настоящая Политика конфиденциальности регулирует обработку и защиту персональных данных пользователей, посещающих наш сайт репетиторов (далее — «Сайт»). Мы стремимся обеспечить безопасность вашей информации и соблюдаем действующее законодательство о защите персональных данных.
        </pre><br/>

        <pre>
        2. Какие данные мы собираем
Мы можем собирать и обрабатывать следующие данные:

Имя, контактные данные (номер телефона, адрес электронной почты);

Данные, предоставленные при регистрации или при заполнении форм на Сайте;

Информацию о посещениях Сайта, в том числе IP-адрес, тип браузера, язык, время посещения и просмотренные страницы;

Информацию о процессе обучения, включая отзывы и сообщения с преподавателями.
        </pre><br/>

        <pre>
        3. Как мы используем ваши данные
Ваши персональные данные используются для следующих целей:

Обеспечение работы Сайта и оказания образовательных услуг;

Связь с пользователями по вопросам обучения, консультаций и технической поддержки;

Улучшение качества сервиса и персонализация взаимодействия с пользователями;

Обеспечение безопасности и предотвращение мошенничества;

Отправка уведомлений, новостей и предложений (если вы дали согласие на их получение).
        </pre><br/>

        <pre>

        4. Передача и хранение данных
Мы не передаем ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом. Данные хранятся на защищенных серверах и используются только в рамках целей, указанных в настоящей Политике.
        </pre><br/>

        <pre>
        5. Защита персональных данных
Мы принимаем все необходимые меры для защиты персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Доступ к информации ограничен только уполномоченным сотрудникам.
        </pre><br/>

        <pre>
        6. Ваши права
Вы имеете право:

Запрашивать информацию о том, какие данные о вас хранятся;

Вносить изменения в свои данные или удалять их по запросу;

Отказаться от получения маркетинговых рассылок;

Обратиться с жалобой в контролирующие органы, если считаете, что ваши данные обрабатываются с нарушением закона.
        </pre><br/>

        <pre>
        7. Изменения в Политике конфиденциальности
Мы можем вносить изменения в настоящую Политику конфиденциальности. Обновленная версия будет опубликована на Сайте с указанием даты последнего обновления.
        </pre><br/>

        <pre>
        8. Контактная информация
        Если у вас есть вопросы по поводу обработки персональных данных, свяжитесь с нами по электронной почте: 
        </pre> <a className="font-bold">ra.ivanov1405@gmail.com</a><br/>
        
        </div>
       )







    }
  }

  useEffect(() => {
         if(window.innerWidth < 600) {
            setTextSize("text-xl")
         } else {
          setTextSize("text-2xl");
         }
  }, [window.innerWidth])
  
return(
    <div className="privacyPolicy" style={{marginLeft: "5%", marginRight: "5%"}}>
           <h1 className={`text-center font-bold ${textSize}`}>{TranslateClass.header()}</h1><br/>
           {TranslateClass.content()}     
    </div>
    )
   
  }

  export default React.memo(BodyPrivacyPolicy);
