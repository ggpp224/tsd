///<reference path="../../_ref.d.ts" />
///<reference path="../../tsd/data/DefIndex.ts" />
///<reference path="../../tsd/data/DefInfoParser.ts" />
///<reference path="SubCore.ts" />

module tsd {
	'use strict';

	var Q = require('q');

	export class InfoParser extends tsd.SubCore {

		constructor(core:tsd.Core) {
			super(core, 'info', 'InfoParser');
		}
		/*
		 lazy load a DefVersion content and parse header for DefInfo meta data
		 promise: DefVersion: with raw .content text and .info DefInfo filled with parsed meta data
		 */
		parseDefInfo(file:tsd.DefVersion):Q.Promise<DefVersion> {
			var d:Q.Deferred<DefVersion> = Q.defer();
			this.track.promise(d.promise, 'parse', file.key);

			this.core.content.loadContent(file).progress(d.notify).then((file:tsd.DefVersion) => {
				var parser = new tsd.DefInfoParser();
				if (file.info) {
					//TODO why not do an early bail and skip reparse?
					file.info.resetFields();
				}
				else {
					file.info = new tsd.DefInfo();
				}

				parser.parse(file.info, file.blob.content.toString('utf8'));

				if (!file.info.isValid()) {
					//this.log.warn('bad parse in: ' + file);
					//TODO print more debug info
				}
				d.resolve(file);
			}).fail(d.reject);

			return d.promise;
		}

		/*
		 bulk version of parseDefInfo()
		 promise: array: bulk results of single calls
		 */
		parseDefInfoBulk(list:tsd.DefVersion[]):Q.Promise<DefVersion[]> {
			var d:Q.Deferred<DefVersion[]> = Q.defer();
			this.track.promise(d.promise, 'parse_bulk');
			// needed?
			list = tsd.DefUtil.uniqueDefVersion(list);

			Q.all(list.map((file:tsd.DefVersion) => {
				return this.parseDefInfo(file).progress(d.notify);
			})).then((list) => {
				d.resolve(list);
			}, d.reject);

			return d.promise;
		}
	}
}
